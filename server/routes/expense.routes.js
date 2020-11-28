import express from 'express'
import expenseCtrl from '../controllers/expense.controller'
import authCtrl from '../controllers/auth.controller'

const router = express.Router()

router.route('/api/expenses/current/preview')
  .get(authCtrl.requireSignin, expenseCtrl.currentMonthPreview)

router.route('/api/expenses/by/category')
  .get(authCtrl.requireSignin, expenseCtrl.expenseByCategory)

router.route('/api/expenses/plot')
  .get(authCtrl.requireSignin, expenseCtrl.plotExpenses)

router.route('/api/expenses/category/averages')
  .get(authCtrl.requireSignin, expenseCtrl.averageCategories)

router.route('/api/expenses/yearly')
  .get(authCtrl.requireSignin, expenseCtrl.yearlyExpenses)

router.route('/api/expenses')
/**A POST request to this route at /api/expenses will first ensure that the requesting user is signed in with the requireSignin method from the auth controllers, before
invoking the create method to add a new expense record in the database */
  .post(authCtrl.requireSignin, expenseCtrl.create)
  /**A GET request to this route will first ensure that the requesting user is signed in,
before invoking the controller method to fetch the expenses from the database users will only be able to view their own expenses. */
  .get(authCtrl.requireSignin, expenseCtrl.listByUser)

  /**The :expenseId parameter in the route URL, /api/expenses/:expenseId, will
invoke the expenseByID controller method. It retrieves the expense from the database and
attaches it to the request object to be used in the next method. */
router.route('/api/expenses/:expenseId')
  // .get(authCtrl.requireSignin, expenseCtrl.read)
/**A PUT or DELETE request to this route will first ensure that the current user is signed in with the requireSignin auth controller method, before checking authorization
and performing any operations in the database */
  .put(authCtrl.requireSignin, expenseCtrl.hasAuthorization, expenseCtrl.update)
  .delete(authCtrl.requireSignin, expenseCtrl.hasAuthorization, expenseCtrl.remove)

   /**The :expenseId parameter in the route URL, /api/expenses/:expenseId, will
invoke the expenseByID controller method. It retrieves the expense from the database and
attaches it to the request object to be used in the next method. */
router.param('expenseId', expenseCtrl.expenseByID)

export default router
