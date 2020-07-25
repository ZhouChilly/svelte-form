import { writable, derived, get } from 'svelte/store'
import { BREAK_FLAG } from './rule/ignoreEmpty'

// Rules
import required from './rule/required'

const isNullOrUndefined = value => {
  return typeof value === 'undefined' || value === null
}

const isArray = value => {
  return Array.isArray(value)
}

function validationRules(key, validation) {
  validation = validation || {}
  if (isNullOrUndefined(validation[key])) {
    return []
  }
  if (isArray(validation[key])) {
    return validation[key]
  }
  return [validation[key]]
}

function validate(value, rules) {
  for (let i = 0; i < rules.length; i++) {
    const err = rules[i](value)
    if (err === BREAK_FLAG) {
      return true
    } else if (err !== true) {
      return err
    }
  }
  return true
}

function createForm(fields, validation, opts) {
  opts = opts || {}
  opts.onCreateValidation = opts.onCreateValidation || false
  const _fields = {}
  const form = writable(Date.now())

  // Field wrapper structure
  const field = (key, rules) => {
    let firstPass = true
    const fieldValue = writable(fields[key])
    const state = writable({
      valid: true,
      error: '',
    })
    form.subscribe(() => {
      const res = validate(get(fieldValue), rules)
      state.set({
        valid: res === true,
        error: res === true ? '' : res,
      })
    })

    fieldValue.subscribe(value => {
      fieldValue.set(value)
      if (firstPass) {
        firstPass = false
        if (opts.onCreateValidation === false) {
          state.set({
            valid: true,
            error: '',
          })
          return
        }
      }

      const res = validate(value, rules)
      state.set({
        valid: res === true,
        error: res === true ? '' : res,
      })
    })
    return {
      value: fieldValue,
      state: state,
    }
  }

  // Convert all inputs into field wrappers
  let key
  for (key in fields) {
    if (fields.hasOwnProperty(key)) {
      _fields[key] = field(key, validationRules(key, validation))
    }
  }

  // Overall valid state
  const { subscribe } = derived(
    Object.values(_fields).map(f => f.state),
    $states => {
      return {
        valid: $states.every(s => s.valid === true),
      }
    },
  )

  return {
    subscribe,
    field: key => {
      if (isNullOrUndefined(_fields[key])) {
        return undefined
      }
      return {
        value: _fields[key].value,
        state: _fields[key].state,
      }
    },
    setFieldError(key, errorMessage) {
      _fields[key].state.set({
        valid: false,
        error: errorMessage,
      })
    },
    validate: () => {
      form.set(Date.now())
    },
    data: () => {
      const data = {}
      let key
      for (key in _fields) {
        if (_fields.hasOwnProperty(key)) {
          data[key] = get(_fields[key].value)
        }
      }
      return data
    },
  }
}

export default { createForm, required }
