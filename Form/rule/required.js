const isNullOrUndefined = value => {
  return typeof value === 'undefined' || value === null
}

const isObject = value => {
  return (
    isNullOrUndefined(value) == false &&
    typeof value === 'object' &&
    value.constructor === Object
  )
}

const isFunction = value => {
  return typeof value === 'function'
}

const isString = value => {
  return typeof value === 'string' || value instanceof String
}

export default msg => value => {
  if (
    isNullOrUndefined(value) ||
    isObject(value) ||
    isFunction(value)
  ) {
    return msg
  }
  if (isString(value)) {
    value = value.trim()
    if (value.length == 0) {
      return msg
    }
  }
  return true
}
