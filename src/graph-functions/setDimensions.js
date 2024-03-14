export function setDimensions(size, margin, leftChartMargin) {
  const dimensions = {}
  dimensions["outerWidth"] = size[0]
  dimensions["outerHeight"] = size[1]
  dimensions["innerWidth"] = dimensions.outerWidth - margin.left - margin.right
  dimensions["innerHeight"] = dimensions.outerHeight - margin.top
  dimensions["width"] = dimensions.innerWidth - leftChartMargin
  dimensions["height"] = dimensions.innerHeight
  dimensions["leftChartMargin"] = leftChartMargin

  return dimensions
}