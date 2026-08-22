export function convertTemperature(value, unit) {
  return unit === 'fahrenheit' ? (value * 9) / 5 + 32 : value
}

export function formatTemperature(value, unit, symbol) {
  return `${Math.round(convertTemperature(value, unit))}${symbol}`
}
