// @flow

import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { REQUIRED, EMAIL } from './validation'

import type { FieldName, FieldValidateFunction } from './types'

type Props = {
  name: FieldName,
  label?: string,
  required?: boolean,
  multiline?: boolean,
  type: string,
  value?: string,
  defaultValue?: string,
  onChange?: (e: SyntheticEvent) => void,
  validation?: FieldValidateFunction | Array<FieldValidateFunction>,
}

export default class Input extends Component {
  props: Props

  static defaultProps = {
    type: 'text',
  }

  static contextTypes = {
    addField: PropTypes.func,
    removeField: PropTypes.func,
    valueChanged: PropTypes.func,
    submitted: PropTypes.func,
    getInitialValue: PropTypes.func,
  }

  state: {
    value: string,
  }

  constructor(props: Props, context: any) {
    super(props, context)

    this.state = {
      value:
        props.value ||
        props.defaultValue ||
        (context && context.getInitialValue(props.name)) ||
        '',
    }
  }

  componentDidMount() {
    if (this.context && this.context.addField) {
      const { value } = this.state
      this.context.addField({
        name: this.props.name,
        value,
        validate: this.validate,
      })

      if (this.state.value) {
        this.propagateValue()
      }
    }
  }

  componentWillUnmount() {
    if (this.context && this.context.removeField) {
      this.context.removeField(this.props.name)
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    let { value } = this.state

    if ('value' in nextProps) {
      value = nextProps.value
    }

    if (this.context && this.props.name !== nextProps.name) {
      this.context.removeField(this.props.name)
      this.context.addField({
        name: nextProps.name,
        value,
        validate: this.validate,
      })
    }

    if (value !== this.state.value) {
      this.setState(
        {
          value,
        },
        this.propagateValue,
      )
    }
  }

  propagateValue = () => {
    if (this.context && this.context.valueChanged) {
      this.context.valueChanged(this.props.name, this.state.value)
    }
  }

  onChange = (e: SyntheticEvent) => {
    const { value } = (e.currentTarget: window.HTMLInputElement)

    this.setState(
      {
        value,
      },
      this.propagateValue,
    )

    if (this.props.onChange) {
      this.props.onChange(e)
    }
  }

  validate = () => {
    let { validation, required } = this.props

    if (!validation) {
      validation = []
    } else if (!Array.isArray(validation)) {
      validation = [validation]
    }

    if (required) {
      validation = [REQUIRED, ...validation]
    }

    if (this.props.type === 'email') {
      validation = [EMAIL, ...validation]
    }

    return validation
      .map(fun => fun(this.state.value, this.props.label))
      .filter(m => m)
      .join(' ')
  }

  render() {
    const { validation, multiline, ...remainingProps } = this.props
    if (multiline) {
      return (
        <textarea
          {...remainingProps}
          value={this.state.value}
          onChange={this.onChange}
        />
      )
    }

    return (
      <input
        {...remainingProps}
        value={this.state.value}
        onChange={this.onChange}
      />
    )
  }
}
