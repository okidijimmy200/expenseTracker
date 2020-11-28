import Expense from '../models/expense.model'
import extend from 'lodash/extend'
import errorHandler from './../helpers/dbErrorHandler'
import mongoose from 'mongoose'

const create = async (req, res) => {
  try {
    /**create method, we set the recorded_by field to the user currently signed in,
before using the expense data provided in the request body to save the new expense
in the Expense collection in the database */
    req.body.recorded_by = req.auth._id
    const expense = new Expense(req.body)
    await expense.save()
    return res.status(200).json({
      message: "Expense recorded!"
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}
 /**The :expenseId parameter in the route URL, /api/expenses/:expenseId, will
invoke the expenseByID controller method. It retrieves the expense from the database and
attaches it to the request object to be used in the next method. */
const expenseByID = async (req, res, next, id) => {
    try {
      /**The expense object retrieved that is from the database will also contain the name and
ID details of the user who recorded the expense, as we specified in
the populate() method */
      let expense = await Expense.findById(id).populate('recorded_by', '_id name').exec()
      if (!expense)
        return res.status('400').json({
          error: "Expense record not found"
        })
      req.expense = expense
      next()
    } catch (err){
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
}

const read = (req, res) => {
    return res.json(req.expense)
}

/**After the user authentication is confirmed, in the listByUser controller method we query the Expense collection in the database using date range specified in the request and the
ID of the user who is signed in. */
const listByUser = async (req, res) => {
  /**we start by gathering the first day and the last day of the date range specified in the request query. From the database, we then retrieve the expenses
incurred by the signed-in user within these dates. The signed-in user is matched against the user referenced in the recorded _by field. The find query against the
Expense collection using these values will return matching expenses sorted by the incurred_on field, with the recently incurred expenses listed first */
  let firstDay = req.query.firstDay
  let lastDay = req.query.lastDay
  try {
    let expenses = await Expense.find({'$and':[{'incurred_on':{'$gte': firstDay, '$lte':lastDay}}, {'recorded_by': req.auth._id}]}).sort('incurred_on').populate('recorded_by', '_id name')
    res.json(expenses)
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}
//1.
/**we will use MongoDB's aggregation framework to perform three sets of aggregations on the Expense collection and retrieve the total expenses for the current month, the current date, and
the day before. */
const currentMonthPreview = async (req, res) => {
  /**we first determine the dates needed to find matching expenses, and then we perform the aggregations before returning the results in the response. */
  const date = new Date(), y = date.getFullYear(), m = date.getMonth()
  /**We first determine the dates for the current month's first day and last day */
  const firstDay = new Date(y, m, 1)
  const lastDay = new Date(y, m + 1, 0)

  /**the dates for today, tomorrow, and yesterday with the minutes and seconds set to zero. */
  const today = new Date()
  today.setUTCHours(0,0,0,0)
  
  const tomorrow = new Date()
  tomorrow.setUTCHours(0,0,0,0)
  tomorrow.setDate(tomorrow.getDate()+1)
  
  const yesterday = new Date()
  yesterday.setUTCHours(0,0,0,0)
  yesterday.setDate(yesterday.getDate()-1)
  /**NB: We will need these dates to specify the ranges for finding the matching expenses that were incurred in the current month, today, and yesterday. */
  /**with these values and the signed-in user's ID reference, we construct the aggregation pipelines
necessary to retrieve the total expenses for the current month, today, and yesterday. */
  try {
    let currentPreview = await Expense.aggregate([
      {
        /**We group these three different aggregation pipelines using the $facet stage in
MongoDB's aggregation framework */
//////////////////////////////////////////////////////////////////////////////////////////////////////
/**For each aggregation pipeline, we first match the expenses using the date range values for the incurred_on field, and also the recorded_by field with the current
user's reference, so the aggregation is only performed on the expenses recorded by the current user. */
          $facet: { month: [
                              { $match : { incurred_on : { $gte : firstDay, $lt: lastDay }, recorded_by: mongoose.Types.ObjectId(req.auth._id)}},
                              /**Then, the matching expenses in each pipeline are grouped to calculate the total amount spent. */
                              { $group : { _id : "currentMonth" , totalSpent:  {$sum: "$amount"} } },
                            ],
                    today: [
                      { $match : { incurred_on : { $gte : today, $lt: tomorrow }, recorded_by: mongoose.Types.ObjectId(req.auth._id) }},
                      { $group : { _id : "today" , totalSpent:  {$sum: "$amount"} } },
                    ],
                    yesterday: [
                      { $match : { incurred_on : { $gte : yesterday, $lt: today }, recorded_by: mongoose.Types.ObjectId(req.auth._id) }},
                      { $group : { _id : "yesterday" , totalSpent:  {$sum: "$amount"} } },
                    ]
                  }
      }])
    let expensePreview = {month: currentPreview[0].month[0], today: currentPreview[0].today[0], yesterday: currentPreview[0].yesterday[0] }
    res.json(expensePreview)
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

// 2.
/**we will use different features of MongoDB's aggregation framework to separately calculate the monthly
expense averages for each category and the total spent in the current month per category, before combining the two results to return these two values associated with
each category to the requesting client. */
const expenseByCategory = async (req, res) => {
  /**we first determine the dates required to find matching expenses, and then we perform the aggregations before returning the results in the response */
  const date = new Date(), y = date.getFullYear(), m = date.getMonth()
  const firstDay = new Date(y, m, 1)
  const lastDay = new Date(y, m + 1, 0)

  try {
    /**we will use an aggregation pipeline containing a $facet with two sub-pipelines for calculating the monthly average per category and the total spent per
category in the current month */
    let categoryMonthlyAvg = await Expense.aggregate([
      {
        /**we take these two resulting arrays from the subpipelines to merge the results. */
        $facet: {
          /**While projecting the output of the sub-pipelines in the $facet stage, we make sure that the keys of the result objects are _id and value in both output arrays, so they
can be merged uniformly */
            average: [
              { $match : { recorded_by: mongoose.Types.ObjectId(req.auth._id) }},
              { $group : { _id : {category: "$category", month: {$month: "$incurred_on"}}, totalSpent:  {$sum: "$amount"} } },
              { $group: { _id: "$_id.category", avgSpent: { $avg: "$totalSpent"}}},
              {
                  $project: {
                    _id: "$_id", value: {average: "$avgSpent"},
                  }
              }
            ],
            total: [
              { $match : { incurred_on : { $gte : firstDay, $lte: lastDay }, recorded_by: mongoose.Types.ObjectId(req.auth._id) }},
              { $group : { _id : "$category", totalSpent:  {$sum: "$amount"} } },
              {
                $project: {
                  _id: "$_id", value: {total: "$totalSpent"},
                }
              }
            ]
        }
      },
      {
        /**Once the faceted aggregation operations are done, we use a $setUnion on the results to combine the arrays. Then, we make the resulting
combined array the new root document in order to run a $group aggregation on it to merge the values for the averages and totals per category. */
        $project: {
          overview: { $setUnion:['$average','$total'] },
        }
      },
      {$unwind: '$overview'},
      /**The final output from this aggregation pipeline will contain an array with an object
for each expense category. Each object in this array will have the category name as the
_id value and a mergedValues object containing the average and total values for the
category */
      {$replaceRoot: { newRoot: "$overview" }},
      { $group: { _id: "$_id", mergedValues: { $mergeObjects: "$value" } } }
    ]).exec()
    /**this final output array generated from the aggregation is sent back in
the response to the requesting client. */
    res.json(categoryMonthlyAvg)
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

// 3.a
const averageCategories = async (req, res) => {
  const firstDay = new Date(req.query.firstDay)
  const lastDay = new Date(req.query.lastDay)

  try {
    let categoryMonthlyAvg = await Expense.aggregate([
      { $match : { incurred_on : { $gte : firstDay, $lte: lastDay }, recorded_by: mongoose.Types.ObjectId(req.auth._id)}},
      { $group : { _id : {category: "$category"}, totalSpent:  {$sum: "$amount"} } },
      { $group: { _id: "$_id.category", avgSpent: { $avg: "$totalSpent"}}},
      { $project: {x: '$_id', y: '$avgSpent'}}
    ]).exec()
    res.json({monthAVG:categoryMonthlyAvg})
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

// 3.b
const yearlyExpenses = async (req, res) => {
  const y = req.query.year
  const firstDay = new Date(y, 0, 1)
  const lastDay = new Date(y, 12, 0)
  try {
    let totalMonthly = await Expense.aggregate(  [
      { $match: { incurred_on: { $gte : firstDay, $lt: lastDay }, recorded_by: mongoose.Types.ObjectId(req.auth._id) }},
      { $group: { _id: {$month: "$incurred_on"}, totalSpent:  {$sum: "$amount"} } },
      { $project: {x: '$_id', y: '$totalSpent'}}
    ]).exec()
    res.json({monthTot:totalMonthly})
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

//3.c
const plotExpenses = async (req, res) => {
  const date = new Date(req.query.month), y = date.getFullYear(), m = date.getMonth()
  const firstDay = new Date(y, m, 1)
  const lastDay = new Date(y, m + 1, 0)

  try {
    let totalMonthly = await Expense.aggregate(  [
      { $match: { incurred_on: { $gte : firstDay, $lt: lastDay }, recorded_by: mongoose.Types.ObjectId(req.auth._id) }},
      { $project: {x: {$dayOfMonth: '$incurred_on'}, y: '$amount'}}
    ]).exec()
    res.json(totalMonthly)
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

/**Once it has been confirmed that the user trying to update the expense is the one who
recorded it and if it is a PUT request, then the update method is invoked next to
update the expense document with the new changes in the Expense collection */
  const update = async (req, res) => {
    try {
      // retrieves the expense details from req.expense,
      let expense = req.expense
// then uses the lodash module to extend and merge the changes that came in the request body to update the expense data.
      expense = extend(expense, req.body)
      /**Before saving this updated expense to the database, the updated field is populated with the current date to reflect the last updated
timestamp. */
      expense.updated = Date.now()

      await expense.save()
      /**On the successful save of this update, the updated expense object is sent
back in the response. */
      res.json(expense)
    } catch (err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
  }
  
/**If it is a DELETE request instead of a PUT request, the remove method is invoked instead in order to delete the specified expense document from the collection in the
database. */
const remove = async (req, res) => {
    try {
      let expense = req.expense
      let deletedExpense = await expense.remove()
      res.json(deletedExpense)
    } catch (err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
}

/**we verify that this expense object was actually recorded by the signed-in user with the hasAuthorization method */
const hasAuthorization = (req, res, next) => {
  const authorized = req.expense && req.auth && req.expense.recorded_by._id == req.auth._id
  if (!(authorized)) {
    return res.status('403').json({
      error: "User is not authorized"
    })
  }
  /**Once it has been confirmed that the user trying to update the expense is the one who
recorded it and if it is a PUT request, then the update method is invoked next to
update the expense document with the new changes in the Expense collection */
  next()
}

export default {
    create,
    expenseByID,
    read,
    currentMonthPreview,
    expenseByCategory,
    averageCategories,
    yearlyExpenses,
    plotExpenses,
    listByUser,
    remove,
    update,
    hasAuthorization
}