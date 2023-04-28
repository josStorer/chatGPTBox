export function parseFloatWithClamp(value, defaultValue, min, max) {
  value = parseFloat(value)

  if (isNaN(value)) value = defaultValue
  else if (value > max) value = max
  else if (value < min) value = min

  return value
}
