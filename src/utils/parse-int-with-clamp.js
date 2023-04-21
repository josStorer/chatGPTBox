export function parseIntWithClamp(value, defaultValue, min, max) {
  value = parseInt(value)

  if (isNaN(value)) value = defaultValue
  else if (value > max) value = max
  else if (value < min) value = min

  return value
}
