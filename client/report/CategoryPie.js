import React, {useState, useEffect} from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import auth from '../auth/auth-helper'
import DateFnsUtils from '@date-io/date-fns'
import { DatePicker, MuiPickersUtilsProvider} from "@material-ui/pickers"
import {averageCategories} from './../expense/api-expense.js'
import { VictoryPie, VictoryTheme, VictoryLabel} from "victory"

const useStyles = makeStyles(theme => ({
  title: {
    padding:`16px ${theme.spacing(2.5)}px 2px`,
    color: '#2bbd7e',
    display:'inline'
  },
  search:{
    display: 'flex',
    alignItems: 'center'
  },
  textField: {
    margin:'8px 16px',
    width:240
  },
}))

/**We will implement a React component that calls the average expenses by category API to render the received array of average expenses incurred per category in a
Victory Pie chart */

//////////////////////////////////////
/**When this component loads, we render a pie chart for the average expenses incurred per category in the given month. We also add two
DatePicker components to allow users to select the desired date range and retrieve
data for that range with a button click. */
export default function Reports() {
    const classes = useStyles()
    const [error, setError] = useState('')
    const [expenses, setExpenses] = useState([])
    const jwt = auth.isAuthenticated()
    const date = new Date(), y = date.getFullYear(), m = date.getMonth()
    const [firstDay, setFirstDay] = useState(new Date(y, m, 1))
    const [lastDay, setLastDay] = useState(new Date(y, m + 1, 0))
    /**we retrieve the initial average expense data with a useEffect hook when the component loads. */
    useEffect(() => {
        const abortController = new AbortController()
        const signal = abortController.signal
        averageCategories({firstDay: firstDay, lastDay: lastDay},{t: jwt.token}, signal).then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            // With the data received from the backend and set in state,
            setExpenses(data)
          }
        })
        return function cleanup(){
          abortController.abort()
        }
    }, [])
   
    const handleDateChange = name => date => {
        if(name=='firstDay'){
            setFirstDay(date)
        }else{
            setLastDay(date)
        }
    }
    const searchClicked = () => {
        averageCategories({firstDay: firstDay, lastDay: lastDay},{t: jwt.token}).then((data) => {
            if (data.error) {
              setRedirectToSignin(true)
            } else {
              setExpenses(data)
            }
        })
    }
    return (
      <div>
            <div className={classes.search}>
                <Typography variant="h6" className={classes.title}>Expenditures per category </Typography>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <DatePicker
                    disableFuture
                    format="dd/MM/yyyy"
                    label="FROM"
                    views={["year", "month", "date"]}
                    value={firstDay}
                    className={classes.textField}
                    onChange={handleDateChange('firstDay')}
                />
                <DatePicker
                    format="dd/MM/yyyy"
                    label="TO"
                    views={["year", "month", "date"]}
                    value={lastDay}
                    className={classes.textField}
                    onChange={handleDateChange('lastDay')}
                />      
        </MuiPickersUtilsProvider>
        <Button variant="contained" color="secondary" onClick={searchClicked}>GO</Button>
        </div>
      
                <div style={{width: 550, margin: 'auto'}}>
                <svg viewBox="0 0 320 320">
                {/* We can add the following code in the component view to render a
customized pie chart with individual text labels for each slice and a center label for
the chart. */}
            <VictoryPie standalone={false} data={expenses.monthAVG} innerRadius={50} theme={VictoryTheme.material} 
                labelRadius={({ innerRadius }) => innerRadius + 14 }
                /**To render the pie chart with a separate center label, we place
a VictoryPie component in an svg element, giving us the flexibility to customize
the pie chart wrapping and a separate circular label using a VictoryLabel outside
the pie chart code */
                labelComponent={<VictoryLabel angle={0} style={[{
                    fontSize: '11px',
                    fill: '#0f0f0f'
                },
                {
                    fontSize: '10px',
                    fill: '#013157'
                }]} text={( {datum} ) => `${datum.x}\n $${datum.y}`}/>}
                 />
                 {/* We pass the data to VictoryPie, define customized labels for each slice, and make
the pie chart standalone so that the center label can be placed over the chart. This
code plots and renders the pie chart against the data provided with the average
expense displayed for each category. */}
                 <VictoryLabel
          textAnchor="middle"
          style={{ fontSize: 14, fill: '#8b8b8b' }}
          x={175} y={170}
          text={`Spent \nper category`}
        />
        </svg>
                 </div>
        
                
        </div>
    )
  }