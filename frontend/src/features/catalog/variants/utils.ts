export interface VariantOptionSelector {
  attributeId: string;
  name: string;
  options: { id: string; label: string; value: string }[];
}

export interface GeneratedVariant {
  title: string;
  priceOverride: number;
  salePriceOverride?: number;
  costPrice?: number;
  displayOrder: number;
  attributeValues: {
    attributeId: string;
    attributeOptionId: string;
    value: string;
  }[];
}

/**
 * Generates the cartesian product of attribute options.
 * ponytail: simple recursive cartesian array generator, no extra external modules.
 */
export function generateVariantMatrix(
  attributes: VariantOptionSelector[],
  basePrice: number,
): GeneratedVariant[] {
  // Clear out any attributes with empty option arrays
  const activeAttributes = attributes.filter((a) => a.options.length > 0);
  if (activeAttributes.length === 0) return [];

  const results: GeneratedVariant[] = [];

  function helper(
    attrIndex: number,
    currentCombo: { attributeId: string; attributeOptionId: string; label: string; value: string }[],
  ) {
    if (attrIndex === activeAttributes.length) {
      // Build title, e.g. "Red / S"
      const title = currentCombo.map((c) => c.label).join(' / ');
      const displayOrder = results.length;
      results.push({
        title,
        priceOverride: basePrice,
        displayOrder,
        attributeValues: currentCombo.map((c) => ({
          attributeId: c.attributeId,
          attributeOptionId: c.attributeOptionId,
          value: c.value,
        })),
      });
      return;
    }

    const currentAttribute = activeAttributes[attrIndex];
    for (const option of currentAttribute.options) {
      helper(attrIndex + 1, [
        ...currentCombo,
        {
          attributeId: currentAttribute.attributeId,
          attributeOptionId: option.id,
          label: option.label,
          value: option.value,
        },
      ]);
    }
  }

  helper(0, []);
  return results;
}
