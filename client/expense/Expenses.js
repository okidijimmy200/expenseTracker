import React, {useState, useEffect} from 'react'
import { makeStyles } from '@material-ui/core/styles'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Edit from '@material-ui/icons/Edit'
import auth from '../auth/auth-helper'
import {listByUser, update} from './api-expense.js'
import DeleteExpense from './DeleteExpense'
import Icon from '@material-ui/core/Icon'
import {Redirect} from 'react-router-dom'
import DateFnsUtils from '@date-io/date-fns'
import { DatePicker, DateTimePicker, MuiPickersUtilsProvider} from "@material-ui/pickers"


const useStyles = makeStyles(theme => ({
  root: {
    width: '90%',
    maxWidth: '800px',
    margin: 'auto',
    marginTop: 40,
    marginBottom: 40
  },
  heading: {
    fontSize: '1.5em',
    fontWeight: theme.typography.fontWeightRegular,
    
    marginTop: 12,
    marginBottom: 4
  },
  error: {
    verticalAlign: 'middle'
  },
  notes: {
    color: 'grey'
  },
  panel: {
    border: '1px solid #58bd7f',
    margin: 6
  },
  info: {
      marginRight: 32,
      width: 90
  },
  amount: {
    fontSize: '2em',
    color: '#2bbd7e',
  },
  search:{
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  textField: {
    margin:'8px 16px',
    width:240
  },
  buttons: {
      textAlign:'right'
  },
  status: {
      marginRight: 8
  },
  date: {
      fontSize: '1.1em',
      color: '#8b8b8b',
      marginTop: 4
  }
}))

/**The list of expenses retrieved from the database will be rendered using a React component called Expenses. This component, on the initial load, will render the
expenses incurred by the signed-in user in the current month. In this view, the user will also have the option to pick a date range to retrieve expenses incurred within
specific dates, */
export default function Expenses() {
    const classes = useStyles()
    /**We also initialize the values that are necessary for making this request and for rendering
the response to be received from the serve */
    const [redirectToSignin, setRedirectToSignin] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')
    const [expenses, setExpenses] = useState([])
    const jwt = auth.isAuthenticated()
    const date = new Date(), y = date.getFullYear(), m = date.getMonth()
    const [firstDay, setFirstDay] = useState(new Date(y, m, 1))
    const [lastDay, setLastDay] = useState(new Date(y, m + 1, 0))
    /**use a useEffect hook to make a
fetch call to the list expenses API in order to retrieve the initial list of expenses */
    useEffect(() => {
        const abortController = new AbortController()
        const signal = abortController.signal
        /**We first determine the dates of the first day and the last day of the current month.
These dates are set in the state to be rendered in the search form fields and provided
as the date range query parameters in the request to the server */
////////////////////////////////////////////////////////////////////////////////////////////////////
/**we will only fetch the expenses associated with the current user, we retrieve the signed-in user's auth credentials to be sent with the request. If the request to the server results
in an error, we will redirect the user to the login page. Otherwise, we will set the received expenses in the state to be rendered in the view. */
        listByUser({firstDay: firstDay, lastDay: lastDay},{t: jwt.token}, signal).then((data) => {
          if (data.error) {
            setRedirectToSignin(true)
          } else {
            setExpenses(data)
          }
        })
        return function cleanup(){
          abortController.abort()
        }
    }, [])
    /**When a user interacts with the DatePicker components to select a date, we will
invoke the handleSearchFieldChange method to get the selected date value. This
method gets the date value and sets it to either the firstDay or lastDay value in
the state accordingly */
    const handleSearchFieldChange = name => date => {
        if(name=='firstDay'){
            setFirstDay(date)
        }else{
            setLastDay(date)
        }
    }
/** searchClicked we make another call to the list expenses API with the new dates sent in the query parameters */
    const searchClicked = () => {
        listByUser({firstDay: firstDay, lastDay: lastDay},{t: jwt.token}).then((data) => {
            if (data.error) {
              setRedirectToSignin(true)
            } else {
              setExpenses(data)
            }
        })
    }
    /**When the user interacts with these fields to update the values, we invoke the handleChange method with the corresponding
index of the given expense in the expenses array, the name of the field, and the changed value */
    const handleChange = (name, index) => event => {
      /**The expense object at the given index in the expenses array is updated with the changed value of the specified field and set to state. This will render the view with the
latest values as the user is updating the edit form */
        const updatedExpenses = [...expenses]
        updatedExpenses[index][name] = event.target.value
        setExpenses(updatedExpenses)
    }
    const handleDateChange = index => date => {
        const updatedExpenses = [...expenses]
        updatedExpenses[index].incurred_on = date
        setExpenses(updatedExpenses)
      }
      // When the user is done making changes and clicks on the Update button, we will invoke the clickUpdate method,
    const clickUpdate = (index) => {
      // In this clickUpdate method, we send the updated expense to the backend in a fetch call to an edit expense API
        let expense = expenses[index]
        update({
            expenseId: expense._id
          }, {
            t: jwt.token
          }, expense).then((data) => {
            if (data.error) {
              setError(data.error)
            } else {
              setSaved(true)
              setTimeout(()=>{setSaved(false)}, 3000)
            }
        })
    }
    const removeExpense = (expense) => {
        const updatedExpenses = [...expenses]
        const index = updatedExpenses.indexOf(expense)
        updatedExpenses.splice(index, 1)
        setExpenses(updatedExpenses)
    }
    
    if (redirectToSignin) {
        return <Redirect to='/signin'/>
    }
    return (
      <div className={classes.root}>
      <div className={classes.search}>
        {/* we will add a form to search by date
range, before iterating through the resulting expenses array to render individual
expense details. */}
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        {/* When a user interacts with the DatePicker components to select a date, we will
invoke the handleSearchFieldChange method to get the selected date value. This
method gets the date value and sets it to either the firstDay or lastDay value in
the state accordingly */}
                <DatePicker
                    disableFuture
                    format="dd/MM/yyyy"
                    label="SHOWING RECORDS FROM"
                    className={classes.textField}
                    views={["year", "month", "date"]}
                    value={firstDay}
                    onChange={handleSearchFieldChange('firstDay')}
                />
                <DatePicker
                    format="dd/MM/yyyy"
                    label="TO"
                    className={classes.textField}
                    views={["year", "month", "date"]}
                    value={lastDay}
                    onChange={handleSearchFieldChange('lastDay')}
                />      
        </MuiPickersUtilsProvider>
        <Button variant="contained" color="secondary" onClick={searchClicked}>GO</Button>
        </div>

        {/*we use map to iterate through the list of expenses retrieved from the database and display each expense record to the end user in a Material-UI
ExpansionPanel component.  */}
      {expenses.map((expense, index) => {
            return   <span key={index}>
              {/* In the ExpansionPanel component, we show details of the individual expense record in the Summary section. Then, on the expansion of
the panel, we will give the user the option to edit details of the expense or delete the expense, */}
        <ExpansionPanel className={classes.panel}>
          <ExpansionPanelSummary
            expandIcon={<Edit />}
          >
            <div className={classes.info}>
                <Typography className={classes.amount}>$ {expense.amount}</Typography><Divider style={{marginTop: 4, marginBottom: 4}}/>
                <Typography>
                    {expense.category}
                </Typography>
                <Typography className={classes.date}>{new Date(expense.incurred_on).toLocaleDateString()}</Typography>  
            </div>
            <div>
                <Typography className={classes.heading}>{expense.title}</Typography>
                <Typography className={classes.notes}>
                    {expense.notes}
                </Typography>
            </div>
          </ExpansionPanelSummary>
          <Divider/>
          {/* Users on MERN Expense Tracker will be able to modify the expenses they have already recorded on the application by either updating the details of an expense or
deleting the expense record altogether they will receive these modification options in the expenses list after expanding to see details of an individual expense in the list */}
          <ExpansionPanelDetails style={{display: 'block'}}>
          <div>
            {/* Users will be able to interact with these form fields to change the values and then
click on the Update button to save the changes to the database. We will add these
form fields in the view along with the Update button and delete option */}
              <TextField label="Title" className={classes.textField} value={expense.title} onChange={handleChange('title', index)} margin="normal"/>
             <TextField label="Amount ($)" className={classes.textField} value={expense.amount} onChange={handleChange('amount', index)} margin="normal" type="number"/>
          </div>
          <div>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <DateTimePicker
                    label="Incurred on"
                    className={classes.textField}
                    views={["year", "month", "date"]}
                    value={expense.incurred_on}
                    onChange={handleDateChange(index)}
                    showTodayButton
                />
          </MuiPickersUtilsProvider>
          <TextField label="Category" className={classes.textField} value={expense.category} onChange={handleChange('category', index)} margin="normal"/>
          </div>
          <TextField
            label="Notes"
            multiline
            rows="2"
            value={expense.notes}
            onChange={handleChange('notes', index)}
            className={classes.textField}
            margin="normal"
          />
          <div className={classes.buttons}>
          {
            error && (<Typography component="p" color="error">
              <Icon color="error" className={classes.error}>error</Icon>
              {error}</Typography>)
          }
          {
              saved && <Typography component="span" color="secondary" className={classes.status}>Saved</Typography>
          }
            <Button color="primary" variant="contained" onClick={()=> clickUpdate(index)} className={classes.submit}>Update</Button>
            <DeleteExpense expense={expense} onRemove={removeExpense}/>
          </div>    
          </ExpansionPanelDetails>
        </ExpansionPanel>
        </span>
        })}
      </div>
    )
  }