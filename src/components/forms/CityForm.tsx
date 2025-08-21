"use client";

import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addLocation } from "@/app/actions/locations";
import { Button } from "../formElements/Button";
import TextField from "../formElements/TextField";
import { DeleteButton } from "../formElements/DeleteButton";
import HTMLSelect from "../formElements/HTMLSelect";

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

export function CityForm() {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CityFormValues>({
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-md mx-auto border p-4 py-6 rounded-lg w-full"
    >
      {/* City */}
      <TextField
        label="City"
        {...register("city")}
        error={errors.city?.message}
      />

      {/* Category */}
      <HTMLSelect
        label="Category"
        options={categories.map((category) => ({
          label: category,
          value: category,
        }))}
        {...register("category")}
        error={errors.category?.message}
      />

      {/* Dynamic Areas */}
      <div className="bg-muted/20 rounded-sm p-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 mb-2 relative">
            <TextField
              label="Area"
              {...register(`areas.${index}.value` as const)}
              className="border px-2 py-1"
              error={errors.areas?.[index]?.value?.message}
            />
            {fields.length > 1 && (
              <DeleteButton
                onClick={() => remove(index)}
                icon="x"
                size="micro"
                className="absolute right-2 top-1 rounded-full"
                soundEnabled={true}
              />
            )}
          </div>
        ))}
        <Button
          onClick={() => append({ value: "" })}
          variant="outline"
          className="w-full"
        >
          + Add Area
        </Button>
      </div>

      {/* Separator */}
      <div className="h-px bg-muted my-2"></div>
      <Button type="submit" className="w-full mt-2">
        Save
      </Button>
    </form>
  );
}
