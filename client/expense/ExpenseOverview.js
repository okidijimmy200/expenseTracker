import React, {useEffect, useState} from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'
import {Link} from 'react-router-dom'
import auth from '../auth/auth-helper'
import {currentMonthPreview, expenseByCategory} from './../expense/api-expense.js'

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: 800,
    margin: 'auto',
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(5),
  },
  title2: {
    padding:`32px ${theme.spacing(2.5)}px 2px`,
    color: '#2bbd7e'
  },
  totalSpent: {
    padding: '50px 40px',
    fontSize: '4em',
    margin: 20,
    marginBottom: 30,
    backgroundColor: '#01579b',
    color: '#70f0ae',
    textAlign: 'center',
    borderRadius: '50%',
    border: '10px double #70f0ae',
    fontWeight: 300
  },
  categorySection: {
    padding: 25,
    paddingTop: 16,
    margin: 'auto'
  },
  catDiv: {
    height: '4px',
    margin: '0',
    marginBottom: 8
  },
  val: {
    width: 200,
    display: 'inline-table',
    textAlign: 'center',
    margin: 2
  },
  catTitle: {
    display: 'inline-block',
    padding: 10,
    backgroundColor: '#f4f6f9'
  },
  catHeading: {
    color: '#6b6b6b',
    fontSize: '1.15em',
    backgroundColor: '#f7f7f7',
    padding: '4px 0'
  },
  spent: {
    margin: '16px 10px 10px 0',
    padding: '10px 30px',
    border: '4px solid #58bd7f38',
    borderRadius: '0.5em'
  },
  day: {
    fontSize: '0.9em',
    fontStyle: 'italic',
    color: '#696969'
  }
}))

export default function Home(){
  const classes = useStyles()
  const [expensePreview, setExpensePreview] = useState({month:0, today:0, yesterday:0})
  const [expenseCategories, setExpenseCategories] = useState([])
  const jwt = auth.isAuthenticated()
  /**To retrieve the expense totals and render these in the view, we can call the current
month preview API either in a useEffect hook or when a button is clicked on. */
  useEffect(() => {
      const abortController = new AbortController()
      const signal = abortController.signal
      currentMonthPreview({t: jwt.token}, signal).then((data) => {
        if (data.error) {
          setRedirectToSignin(true)
        } else {
          /**Once the data is received from the backend, we set it to state in a variable called
expensePreview, so the information can be displayed in the view */
          setExpensePreview(data)
        }
      })
      return function cleanup(){
        abortController.abort()
      }
  }, [])
  /**useEffect hook, calls the current expenses by category API to render the average and total values sent by the backend and also
displays the computed difference between these two values. */
  useEffect(() => {
    const abortController = new AbortController()
    const signal = abortController.signal
    expenseByCategory({t: jwt.token}, signal).then((data) => {
      if (data.error) {
        setRedirectToSignin(true)
      } else {
        setExpenseCategories(data)
      }
    })
    return function cleanup(){
      abortController.abort()
    }
  }, [])
  /**To determine the color, we define a method called indicateExpense, */
  const indicateExpense = (values) => {
    /**A different color is returned if the current total is more than, less than, or equal to the
monthly average. This gives the user a quick visual indicator of how they are faring in terms of incurring expenses per category for the current month */
    let color = '#4f83cc'
    if(values.total){
      const diff = values.total-values.average
      if( diff > 0){
        color = '#e9858b'
      }
      if( diff < 0 ){
        color = '#2bbd7e'
      } 
    }
    return color
  }
    return (
        <Card className={classes.card}>
          {/* . In the view of the component, we use this state variable to compose an interface with these details as
desired. we render the total expenses for the current month, for the current date, and for the day before. */}
{/* ---------------------------- */}
{/* These values are only rendered if the corresponding value is returned in the aggregation results from the backend; otherwise, we render a "0." */}
            <Typography variant="h4" className={classes.title2} color="textPrimary" style={{textAlign:'center'}}>You've spent</Typography>
            <div style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
                <Typography component="span" className={classes.totalSpent}>${expensePreview.month ? expensePreview.month.totalSpent : '0'} <span style={{display: 'block', fontSize:'0.3em'}}>so far this month</span></Typography>
                <div style={{margin:'20px 20px 20px 30px' }}>
                  <Typography variant="h5" className={classes.spent} color="primary">${expensePreview.today ? expensePreview.today.totalSpent : '0'} <span className={classes.day}>today</span></Typography>
                  <Typography variant="h5" className={classes.spent} color="primary">${expensePreview.yesterday ? expensePreview.yesterday.totalSpent: '0'} <span className={classes.day}>yesterday </span></Typography>
                  <Link to="/expenses/all"><Typography variant="h6">See more</Typography></Link>
                </div>
              </div>
              <Divider/>
              <div className={classes.categorySection}>
                {/* We will set the values received from the backend to the state in an expenseCategories variable, and render its details in the view. This variable will
contain an array, which we will iterate through in the view code to display three values for each category—the monthly average, the current month's total
expenditure, and the difference between the two with an indication of whether money was saved or not */}
              {expenseCategories.map((expense, index) => {
                return(<div key={index} style={{display: 'grid', justifyContent: 'center'}}> 
                <Typography variant="h5" className={classes.catTitle} >{expense._id}</Typography>
                <Divider className={classes.catDiv} style={{ backgroundColor: indicateExpense(expense.mergedValues)}}/>
                <div>
                <Typography component="span" className={`${classes.catHeading} ${classes.val}`}>past average</Typography>
                <Typography component="span" className={`${classes.catHeading} ${classes.val}`}>this month</Typography>
                {/* we also show a computed value using these two values. */}
                {/* ----------------------------------------------------- */}
                {/* For each item in the array, we first render the category name, then the headings of the three values we will display. The third heading is rendered conditionally depending
on whether the current total is more or less than the monthly average. */}
                <Typography component="span" className={`${classes.catHeading} ${classes.val}`}>{expense.mergedValues.total && expense.mergedValues.total-expense.mergedValues.average > 0 ? "spent extra" : "saved"}</Typography>
                </div>
                <div style={{marginBottom: 3}}>
                  {/* under each heading, we render the corresponding values for the monthly average, the current total—which will be zero if no value was returned—and then the difference
between this average and the total. For the third value, we render the absolute value of the computed difference between the average and total values using Math.abs(). */}
                <Typography component="span" className={classes.val} style={{color:'#595555', fontSize:'1.15em'}}>${expense.mergedValues.average}</Typography>
                <Typography component="span" className={classes.val} style={{color:'#002f6c', fontSize:'1.6em', backgroundColor: '#eafff5', padding: '8px 0'}}>${expense.mergedValues.total? expense.mergedValues.total : 0}</Typography>
                <Typography component="span" className={classes.val} style={{color:'#484646', fontSize:'1.25em'}}>${expense.mergedValues.total? Math.abs(expense.mergedValues.total-expense.mergedValues.average) : expense.mergedValues.average}</Typography>
                </div>
                {/* Based on this difference, we also render the divider under the category name with different colors to indicate whether money was saved, extra money was spent, or the
same amount of money was spent. To determine the color, we define a method called indicateExpense, */}
                <Divider style={{marginBottom:10}}/>
                </div>) 
              })}
            </div>
        </Card> 
    )
}

