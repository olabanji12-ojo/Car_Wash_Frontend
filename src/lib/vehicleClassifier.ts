/**
 * Auto-classifies vehicles based on their model name.
 * Categories: small, medium, large
 * Used for tiered pricing in carwash bookings.
 */

export type VehicleSize = 'small' | 'medium' | 'large';

const SMALL_MODELS = [
  'corolla', 'civic', 'golf', 'micra', 'rio', 'accent', 'yaris', 'fit', 'jazz', 'picanto', 
  'i10', 'i20', 'swift', 'mazda2', 'polo', 'fiesta', 'focus', 'bolt', 'leaf', 'model 3',
  'elantra', 'sentra', 'jetta', 'a3', '1 series', '2 series', 'mini', 'cooper'
];

const LARGE_MODELS = [
  'highlander', 'land cruiser', 'hilux', 'prado', 'pathfinder', 'tundra', 'sequoia', 
  'tahoe', 'suburban', 'escalade', 'navigator', 'expedition', 'f-150', 'silverado', 
  'ram', 'sienna', 'odyssey', 'carnival', 'v-class', 'transporter', 'ranger', 'lx570',
  'gx460', 'gx470', 'pajero', 'l200', 'defender', 'discovery', 'range rover', 'gle',
  'gls', 'x5', 'x7', 'q7', 'q8', 'atlas', 'pilot', 'telluride', 'palisade'
];

export const classifyVehicle = (model: string): VehicleSize => {
  if (!model) return 'medium';
  
  const normalizedModel = model.toLowerCase();
  
  // Check for large keywords first (usually trucks/large SUVs)
  if (LARGE_MODELS.some(m => normalizedModel.includes(m))) {
    return 'large';
  }
  
  // Check for small keywords
  if (SMALL_MODELS.some(m => normalizedModel.includes(m))) {
    return 'small';
  }
  
  // Default to medium for everything else (Camry, Accord, standard SUVs like RAV4, CR-V)
  return 'medium';
};
