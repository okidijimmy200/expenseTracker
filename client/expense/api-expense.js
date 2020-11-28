import queryString from 'query-string'

/**To fetch this API in the frontend, we will add a corresponding create method in api-expense.js. */
const create = async (credentials, expense) => {
    try {
      /**This fetch method will be used in the frontend component that will display a form
where the user can enter details of the new expense and save it on the application */
      let response = await fetch('/api/expenses/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + credentials.t
        },
        body: JSON.stringify(expense)
      })
        return await response.json()
      } catch(err) { 
        console.log(err)
      }
  }
  
  /**The API to retrieve expenses recorded by a specific user can be used in the frontend
to retrieve and display the expenses to the end user. To fetch this API in the frontend,
we will add a corresponding listByUser method in api-expense.js */
  const listByUser = async (params, credentials, signal) => {
    /**In this method, before making the request to the list expenses API, we form the query
string containing the date range with the queryString library. Then, this query
string is attached to the request URL */
    const query = queryString.stringify(params)
    try {
      let response = await fetch('/api/expenses?'+query, {
        method: 'GET',
        signal: signal,
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + credentials.t
        }
      })
      return await response.json()
    }catch(err){
      console.log(err)
    }
  }

  /**After the aggregation operations are completed, we access the computed results and
compose the response to be sent back in the response to the requesting client. This
API can be used in the frontend with a fetch request. You can define a corresponding
fetch method to make the request, similar to other API implementations */
  const currentMonthPreview = async (credentials, signal) => {
    try {
      let response = await fetch('/api/expenses/current/preview', {
        method: 'GET',
        signal: signal,
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + credentials.t
        }
      })
      return await response.json()
    }catch(err){
      console.log(err)
    }
  }

  const expenseByCategory = async (credentials, signal) => {
    try {
      let response = await fetch('/api/expenses/by/category', {
        method: 'GET',
        signal: signal,
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + credentials.t
        }
      })
      return await response.json()
    }catch(err){
      console.log(err)
    }
  }
  
  const averageCategories = async (params, credentials, signal) => {
    const query = queryString.stringify(params)
    try {
      let response = await fetch('/api/expenses/category/averages?'+query, {
        method: 'GET',
        signal: signal,
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + credentials.t
        }
      })
      return await response.json()
    }catch(err){
      console.log(err)
    }
  }
  const yearlyExpenses = async (params, credentials, signal) => {
    const query = queryString.stringify(params)
    try {
      let response = await fetch('/api/expenses/yearly?'+query, {
        method: 'GET',
        signal: signal,
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + credentials.t
        }
      })
      return await response.json()
    }catch(err){
      console.log(err)
    }
  }
  const plotExpenses = async (params, credentials, signal) => {
    const query = queryString.stringify(params)
    try {
      let response = await fetch('/api/expenses/plot?'+query, {
        method: 'GET',
        signal: signal,
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + credentials.t
        }
      })
      return await response.json()
    }catch(err){
      console.log(err)
    }
  }
  const read = async (params, signal) => {
    try {
      let response = await fetch('/api/auction/' + params.auctionId, {
        method: 'GET',
        signal: signal,
      })
      return response.json()
    }catch(err) {
      console.log(err)
    }
  }
  
  const update = async (params, credentials, expense) => {
    try {
      let response = await fetch('/api/expenses/' + params.expenseId, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + credentials.t
          },
        body: JSON.stringify(expense)
      })
      return await response.json()
    } catch(err) {
      console.log(err)
    }
  }
  
  const remove = async (params, credentials) => {
    try {
      let response = await fetch('/api/expenses/' + params.expenseId, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + credentials.t
        }
      })
      return await response.json()
    } catch(err) {
      console.log(err)
    }
  }
  
  export {
    create,
    listByUser,
    currentMonthPreview,
    expenseByCategory,
    averageCategories,
    yearlyExpenses,
    plotExpenses,
    read,
    update,
    remove
  }
  