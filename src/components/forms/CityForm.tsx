"use client";

import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addLocation } from "@/app/actions/locations";
import { Button } from "../formElements/Button";
import TextField from "../formElements/TextField";
import { DeleteButton } from "../formElements/DeleteButton";

const categories = [
  "area",
  "street",
  "market",
  "junction",
  "estate",
  "suburb",
  "landmark",
];

// 1. Schema: areas = array of objects
const CitySchema = z.object({
  city: z.string().min(1, "City is required"),
  category: z.enum([
    "area",
    "street",
    "market",
    "junction",
    "estate",
    "suburb",
    "landmark",
  ]),
  areas: z.array(z.object({ value: z.string().min(1, "Area is required") })),
  /* .transform((arr) => arr.map((a) => a.value)), // ✅ auto-converts */
});

type CityFormValues = z.infer<typeof CitySchema>;
// { city: string; areas: { value: string }[] }

export default function CityForm() {
  const { control, register, handleSubmit } = useForm<CityFormValues>({
    resolver: zodResolver(CitySchema),
    defaultValues: { city: "", category: "area", areas: [{ value: "" }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "areas", // ✅ Works now
  });

  const onSubmit: SubmitHandler<CityFormValues> = async (data) => {
    // Transform areas back into string[]
    const transformed = {
      city: data.city,
      category: data.category,
      areas: data.areas.map((a) => a.value),
    };

    console.log("🔍 Transformed for DB:", transformed);
    /*  console.log("Submitted:", data); */

    try {
      const response = await addLocation(transformed); // call server action
      if (response.success) {
        alert("✅ Locations saved successfully!");
      } else {
        alert(`❌ Error: ${response.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Unexpected error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* City */}
      <div>
        <label>City</label>
        <input {...register("city")} className="border px-2 py-1" />
      </div>

      {/* Category */}
      <div>
        <label>Category</label>
        <select {...register("category")} className="border px-2 py-1">
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Areas */}
      <div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 mb-2">
            <TextField
              label="Area"
              {...register(`areas.${index}.value` as const)} // ✅ Note `.value`
              className="border px-2 py-1"
            />
            <DeleteButton onClick={() => remove(index)} />
          </div>
        ))}
        <button type="button" onClick={() => append({ value: "" })}>
          + Add Area
        </button>
      </div>

      <Button type="submit" className="bg-green-600 text-white px-4 py-2">
        Save
      </Button>
    </form>
  );
}
