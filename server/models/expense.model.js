import mongoose from 'mongoose'

/**-We will implement a Mongoose model to define an Expense model for storing the
details of each expense record */
const ExpenseSchema = new mongoose.Schema({
  /**The title field will describe the expense. It is declared to be
a String type and will be a required field */
  title: {
    type: String,
    trim: true,
    required: 'Title is required'
  },
  /**Expense category: The category field will define the expense type, so expenses can be grouped by this value. It is declared to be a String type
and will be a required field: */
  category: {
    type: String,
    trim: true,
    required: 'Category is required'
  },
  /**Expense amount: The amount field will store the monetary cost of the expense as a value of the Number type, and it will be a required field with a
minimum allowed value of 0: */
  amount: {
      type: Number,
      min: 0,
      required: 'Amount is required'
  },
  /**Incurred on: The incurred_on field will store the date-time when the expense was incurred or paid. It is declared to be a Date type and will
default to the current date-time if no value is provided */
  incurred_on: {
    type: Date,
    default: Date.now
  },
  /**Notes: The notes field, defined as a String type, will allow the recording of additional details or notes for a given expense record: */
  notes: {
    type: String,
    trim: true
  },
  /**Created and updated at times: The created and updated fields will be Date types, with created generated when a new expense is added,
and updated changed when any expense details are modified */
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  },
  /**Expense recorded by: The recorded_by field will reference the user who is creating the expense record: */
  recorded_by: {type: mongoose.Schema.ObjectId, ref: 'User'}
})

export default mongoose.model('Expense', ExpenseSchema)
