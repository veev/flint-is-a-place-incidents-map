// rolling a similar map function to processing's
export const map_range = (value, low1, high1, low2, high2) => {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1)
}

export const toTitleCase = (string) => {
  return string.replace(
    /([^\W_]+[^\s-]*) */g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  )
}