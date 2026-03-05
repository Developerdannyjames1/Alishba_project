import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { expoApi } from "../../api/expoApi";
import { createSocket } from "../../utils/socket";
import type { Booth } from "../../types";

interface ExpoFormData {
  title: string;
  description: string;
  date: string;
  location: string;
  theme: string;
  status: string;
}

export function ExpoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [boothLoading, setBoothLoading] = useState(false);
  const [bulkRows, setBulkRows] = useState("A,B,C,D");
  const [bulkCols, setBulkCols] = useState("1,2,3,4,5");
  const [bulkSize, setBulkSize] = useState("medium");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpoFormData>();

  const isEdit = id && id !== "new";

  const loadExpoData = () => {
    if (!id || id === "new") return;
    expoApi
      .getOne(id)
      .then((res) => {
        const expo = res.data.expo;
        reset({
          title: expo.title,
          description: expo.description || "",
          date: expo.date?.split("T")[0] || "",
          location: expo.location,
          theme: expo.theme || "",
          status: expo.status,
        });
      })
      .catch(() => navigate("/expos"));
    expoApi
      .getBooths(id)
      .then((res) => setBooths(res.data.booths || []))
      .catch(() => setBooths([]));
  };

  useEffect(() => {
    loadExpoData();
  }, [id, reset, navigate]);

  useEffect(() => {
    if (!id || id === "new") return;
    const token = localStorage.getItem("token");
    const socket = createSocket(token || undefined);
    socket.emit("join-expo", id);
    socket.on("expo-updated", () => loadExpoData());
    socket.on("booths-updated", () => {
      expoApi.getBooths(id).then((res) => setBooths(res.data.booths || [])).catch(() => {});
    });
    return () => {
      socket.emit("leave-expo", id);
      socket.off("expo-updated");
      socket.off("booths-updated");
      socket.disconnect();
    };
  }, [id]);

  const onSubmit = async (data: ExpoFormData) => {
    setLoading(true);
    try {
      if (id && id !== "new") {
        await expoApi.update(id, data);
      } else {
        const res = await expoApi.create(data);
        navigate(`/expos/${res.data.expo._id}/edit`, { replace: true });
      }
      if (isEdit) {
        const res = await expoApi.getBooths(id!);
        setBooths(res.data.booths || []);
      }
    } catch {
      alert("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoothsBulk = async () => {
    if (!id || id === "new") return;
    const rows = bulkRows.split(",").map((r) => r.trim()).filter(Boolean);
    const cols = bulkCols.split(",").map((c) => c.trim()).filter(Boolean);
    const toCreate: { boothNumber: string; size: string }[] = [];
    for (const row of rows) {
      for (const col of cols) {
        toCreate.push({ boothNumber: `${row}${col}`, size: bulkSize });
      }
    }
    if (toCreate.length === 0) {
      alert("Enter valid rows and columns (e.g. A,B,C and 1,2,3)");
      return;
    }
    setBoothLoading(true);
    try {
      await expoApi.createBoothsBulk(id, toCreate);
      const res = await expoApi.getBooths(id);
      setBooths(res.data.booths || []);
    } catch {
      alert("Failed to create booths");
    } finally {
      setBoothLoading(false);
    }
  };

  const handleDeleteBooth = async (boothId: string) => {
    if (!id || !confirm("Delete this booth?")) return;
    try {
      await expoApi.deleteBooth(id, boothId);
      setBooths((prev) => prev.filter((b) => b._id !== boothId));
    } catch {
      alert("Failed to delete booth");
    }
  };

  return (
    <div className="expo-form-page">
      <h1>{isEdit ? "Edit Expo" : "Create Expo"}</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <input
            placeholder="Title"
            {...register("title", { required: "Required" })}
          />
          {errors.title && <span className="field-error">{errors.title.message}</span>}
        </div>
        <div>
          <textarea
            placeholder="Description"
            {...register("description")}
          />
        </div>
        <div>
          <input
            type="date"
            {...register("date", { required: "Required" })}
          />
          {errors.date && <span className="field-error">{errors.date.message}</span>}
        </div>
        <div>
          <input
            placeholder="Location"
            {...register("location", { required: "Required" })}
          />
          {errors.location && (
            <span className="field-error">{errors.location.message}</span>
          )}
        </div>
        <div>
          <input placeholder="Theme" {...register("theme")} />
        </div>
        <div>
          <select {...register("status")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </form>

      {isEdit && (
        <section className="booth-allocation">
          <h2>Booth Allocation (Floor Plan)</h2>
          <p>Allocate booth spaces for this expo. Exhibitors can then select from available booths.</p>
          <div className="bulk-create">
            <label>Rows (comma-separated, e.g. A,B,C,D):</label>
            <input
              value={bulkRows}
              onChange={(e) => setBulkRows(e.target.value)}
              placeholder="A,B,C,D"
            />
            <label>Columns (comma-separated, e.g. 1,2,3,4,5):</label>
            <input
              value={bulkCols}
              onChange={(e) => setBulkCols(e.target.value)}
              placeholder="1,2,3,4,5"
            />
            <label>Size:</label>
            <select value={bulkSize} onChange={(e) => setBulkSize(e.target.value)}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
            <button
              type="button"
              onClick={handleCreateBoothsBulk}
              disabled={boothLoading}
            >
              {boothLoading ? "Creating..." : "Create Booths"}
            </button>
          </div>
          <div className="booth-grid floor-plan">
            {booths.map((b) => (
              <div key={b._id} className={`booth-slot ${b.status}`}>
                <span className="booth-num">{b.boothNumber}</span>
                <span className="booth-status">{b.status}</span>
                {b.exhibitorId && (
                  <span className="booth-exhibitor">
                    {(b.exhibitorId as { name?: string }).name}
                  </span>
                )}
                <button
                  type="button"
                  className="btn-delete-booth"
                  onClick={() => handleDeleteBooth(b._id)}
                  title="Delete booth"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
