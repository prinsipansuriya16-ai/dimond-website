"use client";

import {
  ChangeEvent,
  FormEvent,
  MouseEvent,
  useEffect,
  useRef,
  useState
} from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileSpreadsheet,
  Gem,
  ImagePlus,
  PackagePlus,
  TrendingUp,
  Upload
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import GlassCard from "@/components/GlassCard";
import GoldButton from "@/components/GoldButton";
import {
  addBulkDiamonds,
  addDiamond,
  getDiamondsBySeller,
  getSession,
  NewDiamondInput
} from "@/lib/store";
import {
  DiamondCut,
  DiamondListing,
  DiamondClarity,
  DiamondColor,
  DiamondShape,
  SessionUser
} from "@/lib/types";

const SHAPES: DiamondShape[] = [
  "Round",
  "Princess",
  "Emerald",
  "Oval",
  "Pear",
  "Cushion",
  "Marquise",
  "Radiant"
];
const CLARITIES: DiamondClarity[] = [
  "FL",
  "IF",
  "VVS1",
  "VVS2",
  "VS1",
  "VS2",
  "SI1",
  "SI2"
];
const COLORS: DiamondColor[] = ["D", "E", "F", "G", "H", "I", "J"];
const CUTS: DiamondCut[] = ["Excellent", "Very Good", "Good", "Fair"];
const LABS: DiamondListing["certLab"][] = ["GIA", "IGI", "HRD", "FGA"];

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1600267175161-cfaa711b4a81?q=80&w=800&auto=format&fit=crop";

// Cap on how large a Base64 image string we'll try to store in LocalStorage.
// LocalStorage typically caps out around 5MB per origin (shared across all keys),
// so we keep individual images well under that.
const MAX_IMAGE_DATA_URL_LENGTH = 900_000; // ~900KB Base64 string

// Compresses/resizes an uploaded image via <canvas> before it is turned into a
// Base64 data URL, so we don't blow past LocalStorage's storage quota.
function compressImageToDataUrl(
  file: File,
  maxDimension = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image file."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Could not load that image file."));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not process that image in this browser."));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Prefer compressed JPEG output; fall back further if it's still huge.
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
            dataUrl = canvas.toDataURL("image/jpeg", 0.4);
          }
          resolve(dataUrl);
        } catch {
          reject(new Error("Could not process that image."));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface SingleFormState {
  stockNumber: string;
  shape: DiamondShape;
  carat: string;
  clarity: DiamondClarity;
  color: DiamondColor;
  cut: DiamondCut;
  certLab: DiamondListing["certLab"];
  certNumber: string;
  pricePerCarat: string;
  location: string;
  fluorescence: string;
  measurements: string;
  sellerPhone: string;
}

const EMPTY_FORM: SingleFormState = {
  stockNumber: "",
  shape: "Round",
  carat: "",
  clarity: "VS1",
  color: "G",
  cut: "Excellent",
  certLab: "GIA",
  certNumber: "",
  pricePerCarat: "",
  location: "",
  fluorescence: "None",
  measurements: "",
  sellerPhone: ""
};

function parseCsv(text: string): NewDiamondInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1);

  return rows.map((row) => {
    const cells = row.split(",").map((c) => c.trim());
    const getValue = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? cells[idx] : "";
    };

    return {
      stockNumber: getValue("stocknumber") || `CSV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      shape: (getValue("shape") as DiamondShape) || "Round",
      carat: Number(getValue("carat")) || 0,
      clarity: (getValue("clarity") as DiamondClarity) || "VS1",
      color: (getValue("color") as DiamondColor) || "G",
      cut: (getValue("cut") as DiamondCut) || "Excellent",
      certLab: (getValue("certlab") as DiamondListing["certLab"]) || "GIA",
      certNumber: getValue("certnumber") || "",
      pricePerCarat: Number(getValue("pricepercarat")) || 0,
      location: getValue("location") || "Surat, India",
      fluorescence: getValue("fluorescence") || "None",
      measurements: getValue("measurements") || "",
      imageUrl: getValue("imageurl") || DEFAULT_IMAGE,
      sellerPhone: getValue("sellerphone") || ""
    };
  });
}

export default function SellerDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [listings, setListings] = useState<DiamondListing[]>([]);
  const [form, setForm] = useState<SingleFormState>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [csvSummary, setCsvSummary] = useState("");
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        if (!session || session.role !== "seller") {
          router.replace("/auth/login?role=seller");
          return;
        }
        const sellerListings = await getDiamondsBySeller(session.id);
        if (!cancelled) {
          setUser(session);
          setListings(sellerListings);
        }
      } catch (error) {
        console.error(error);
        router.replace("/auth/login?role=seller");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  function updateForm<K extends keyof SingleFormState>(
    key: K,
    value: SingleFormState[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError("");
    try {
      const dataUrl = await compressImageToDataUrl(file);
      if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
        setImageError(
          "That image is too large to store even after compression, so we'll use the default diamond photo instead."
        );
        setImagePreview("");
        setImageFile(null);
        return;
      }
      setImageFile(file);
      setImagePreview(dataUrl);
    } catch (err) {
      setImageError(
        err instanceof Error
          ? err.message
          : "Could not read that image. Please try another file."
      );
      setImagePreview("");
    }
  }

  function clearImage() {
    setImagePreview("");
    setImageFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

  // Handles listing a single diamond. Also usable directly as a button
  // onClick fallback, since it only relies on event.preventDefault().
  async function handleSubmit(
    event: FormEvent | MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    try {
      if (!user) return;

      // Number(...) on an empty/invalid string returns NaN, and NaN is falsy,
      // so `|| 0` safely coerces any bad numeric input down to 0 instead of
      // letting NaN silently break downstream calculations.
      const carat = Number(form.carat) || 0;
      const pricePerCarat = Number(form.pricePerCarat) || 0;
      const sellerPhone = form.sellerPhone.trim();

      if (
        !form.stockNumber ||
        !carat ||
        !pricePerCarat ||
        !form.certNumber ||
        !sellerPhone
      ) {
        alert(
          "Please fill in Stock Number, Carat, Price / Carat, Certificate Number and WhatsApp / Contact Phone Number."
        );
        return;
      }

      // Guard against an oversized image string slipping through and
      // blowing the LocalStorage quota when addDiamond persists it.
      const imageUrl =
        imagePreview && imagePreview.length <= MAX_IMAGE_DATA_URL_LENGTH
          ? imagePreview
          : DEFAULT_IMAGE;

      const input: NewDiamondInput = {
        stockNumber: form.stockNumber,
        shape: form.shape,
        carat,
        clarity: form.clarity,
        color: form.color,
        cut: form.cut,
        certLab: form.certLab,
        certNumber: form.certNumber,
        pricePerCarat,
        location: form.location || "Surat, India",
        fluorescence: form.fluorescence,
        measurements: form.measurements || `${(4 + carat).toFixed(2)}mm`,
        imageUrl,
        sellerPhone
      };

      await addDiamond(input, user.id, user.companyName, imageFile);
      setListings(await getDiamondsBySeller(user.id));
      setForm(EMPTY_FORM);
      clearImage();
      setSuccessMessage(`Stone ${input.stockNumber} listed successfully.`);
      alert("Diamond Listed Successfully!");
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while listing the diamond.";
      alert(message);
    }
  }

  function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseCsv(text).filter((row) => row.carat > 0);
      if (parsed.length === 0) {
        setCsvSummary(
          "No valid rows found. Ensure your CSV has headers: stockNumber, shape, carat, clarity, color, cut, certLab, certNumber, pricePerCarat, location, fluorescence, measurements."
        );
        return;
      }
      addBulkDiamonds(parsed, user.id, user.companyName)
        .then(async () => setListings(await getDiamondsBySeller(user.id)))
        .catch((error) => setCsvSummary(error instanceof Error ? error.message : "CSV import failed."));
      setCsvSummary(`${parsed.length} stones imported successfully.`);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  if (!user) return null;

  const totalValue = listings.reduce(
    (sum, d) => sum + d.carat * d.pricePerCarat,
    0
  );
  const availableCount = listings.filter((d) => d.status === "AVAILABLE").length;

  return (
    <main className="min-h-screen bg-radial-luxury px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader user={user} subtitle="Verified B2B Seller" />

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatCard
            icon={Gem}
            label="Total Listings"
            value={listings.length.toString()}
          />
          <StatCard
            icon={CheckCircle2}
            label="Available Stock"
            value={availableCount.toString()}
          />
          <StatCard
            icon={TrendingUp}
            label="Inventory Value"
            value={`$${totalValue.toLocaleString(undefined, {
              maximumFractionDigits: 0
            })}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <GlassCard className="p-6" hover={false}>
              <div className="mb-4 flex items-center gap-2">
                <PackagePlus className="h-4 w-4 text-imperial" />
                <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-champagne">
                  List a Single Diamond
                </h2>
              </div>

              {successMessage && (
                <div className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 p-3 font-body text-xs text-green-300">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <TextInput
                  label="Stock Number"
                  value={form.stockNumber}
                  onChange={(v) => updateForm("stockNumber", v)}
                  placeholder="KD-1042"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <SelectInput
                    label="Shape"
                    value={form.shape}
                    options={SHAPES}
                    onChange={(v) => updateForm("shape", v as DiamondShape)}
                  />
                  <TextInput
                    label="Carat"
                    type="number"
                    value={form.carat}
                    onChange={(v) => updateForm("carat", v)}
                    placeholder="1.25"
                    required
                  />
                  <SelectInput
                    label="Clarity"
                    value={form.clarity}
                    options={CLARITIES}
                    onChange={(v) => updateForm("clarity", v as DiamondClarity)}
                  />
                  <SelectInput
                    label="Color"
                    value={form.color}
                    options={COLORS}
                    onChange={(v) => updateForm("color", v as DiamondColor)}
                  />
                  <SelectInput
                    label="Cut"
                    value={form.cut}
                    options={CUTS}
                    onChange={(v) => updateForm("cut", v as DiamondCut)}
                  />
                  <SelectInput
                    label="Cert Lab"
                    value={form.certLab}
                    options={LABS}
                    onChange={(v) =>
                      updateForm("certLab", v as DiamondListing["certLab"])
                    }
                  />
                </div>
                <TextInput
                  label="Certificate Number"
                  value={form.certNumber}
                  onChange={(v) => updateForm("certNumber", v)}
                  placeholder="2185663092"
                  required
                />
                <TextInput
                  label="WhatsApp / Contact Phone Number"
                  type="tel"
                  value={form.sellerPhone}
                  onChange={(v) => updateForm("sellerPhone", v)}
                  placeholder="+91 98765 43210"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <TextInput
                    label="Price / Carat (USD)"
                    type="number"
                    value={form.pricePerCarat}
                    onChange={(v) => updateForm("pricePerCarat", v)}
                    placeholder="6200"
                    required
                  />
                  <TextInput
                    label="Location"
                    value={form.location}
                    onChange={(v) => updateForm("location", v)}
                    placeholder="Surat, India"
                  />
                </div>
                <div>
                  <span className="mb-1.5 block font-body text-xs font-medium uppercase tracking-wider text-champagne/60">
                    Diamond Image
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-imperial/25 bg-black/30">
                      <NextImage
                        src={imagePreview || DEFAULT_IMAGE}
                        alt="Diamond preview"
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <label className="focus-gold flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-imperial/40 px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-imperial transition-colors hover:bg-imperial/10">
                        <ImagePlus className="h-4 w-4" />
                        {imagePreview ? "Change Image" : "Upload Image"}
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={clearImage}
                          className="focus-gold self-start font-body text-[11px] text-champagne/40 underline-offset-2 hover:text-imperial hover:underline"
                        >
                          Remove and use default image
                        </button>
                      )}
                    </div>
                  </div>
                  {imageError && (
                    <p className="mt-1.5 font-body text-[11px] text-red-300">
                      {imageError}
                    </p>
                  )}
                  <p className="mt-1.5 font-body text-[10px] text-champagne/40">
                    Optional &mdash; falls back to a default diamond photo if
                    none is uploaded.
                  </p>
                </div>
                <GoldButton type="submit" onClick={handleSubmit} className="w-full">
                  List Diamond
                </GoldButton>
              </form>
            </GlassCard>

            <GlassCard className="p-6" hover={false}>
              <div className="mb-4 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-imperial" />
                <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-champagne">
                  Bulk CSV Upload
                </h2>
              </div>
              <p className="mb-4 font-body text-xs leading-relaxed text-champagne/50">
                Upload a CSV with columns: stockNumber, shape, carat, clarity,
                color, cut, certLab, certNumber, pricePerCarat, location,
                fluorescence, measurements, sellerPhone.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="focus-gold flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-imperial/50 py-3.5 font-body text-xs font-semibold uppercase tracking-widest text-imperial transition-colors hover:bg-imperial/10"
              >
                <Upload className="h-4 w-4" />
                Upload Stock CSV
              </button>
              {csvSummary && (
                <p className="mt-3 font-body text-xs text-champagne/60">
                  {csvSummary}
                </p>
              )}
            </GlassCard>
          </div>

          <div className="lg:col-span-3">
            <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-champagne">
              Your Inventory
            </h2>
            <div className="space-y-3">
              {listings.map((diamond, index) => (
                <motion.div
                  key={diamond.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.4 }}
                >
                  <GlassCard className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-imperial/40 bg-imperial/5">
                        <Gem className="h-4 w-4 text-imperial" />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-semibold text-champagne">
                          {diamond.stockNumber} &middot; {diamond.shape}{" "}
                          {diamond.carat}ct
                        </p>
                        <p className="font-body text-xs text-champagne/50">
                          {diamond.clarity} / {diamond.color} / {diamond.cut} &middot;{" "}
                          {diamond.certLab} {diamond.certNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-sm font-semibold text-imperial">
                        $
                        {(diamond.carat * diamond.pricePerCarat).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 0 }
                        )}
                      </p>
                      <p className="font-body text-[10px] uppercase tracking-wider text-champagne/40">
                        {diamond.status}
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
              {listings.length === 0 && (
                <GlassCard className="p-10 text-center" hover={false}>
                  <p className="font-body text-sm text-champagne/50">
                    You haven&apos;t listed any stock yet. Use the form or
                    bulk CSV upload to add inventory.
                  </p>
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Gem;
  label: string;
  value: string;
}) {
  return (
    <GlassCard className="flex items-center gap-4 p-5" hover={false}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-imperial/40 bg-imperial/10">
        <Icon className="h-5 w-5 text-imperial" />
      </div>
      <div>
        <p className="font-body text-[11px] uppercase tracking-wider text-champagne/50">
          {label}
        </p>
        <p className="font-heading text-lg font-semibold text-champagne">
          {value}
        </p>
      </div>
    </GlassCard>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-body text-xs font-medium uppercase tracking-wider text-champagne/60">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="focus-gold w-full rounded-lg border border-imperial/25 bg-black/30 px-3 py-2 font-body text-sm text-champagne placeholder:text-champagne/25 focus:border-imperial"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-body text-xs font-medium uppercase tracking-wider text-champagne/60">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-gold w-full rounded-lg border border-imperial/25 bg-black/30 px-3 py-2 font-body text-sm text-champagne focus:border-imperial"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#1a1816] text-champagne">
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}