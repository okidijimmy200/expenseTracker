import React, {useState, useEffect} from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import auth from '../auth/auth-helper'
import DateFnsUtils from '@date-io/date-fns'
import { DatePicker, MuiPickersUtilsProvider} from "@material-ui/pickers"
import {yearlyExpenses} from './../expense/api-expense.js'
import {VictoryTheme, VictoryAxis, VictoryBar, VictoryChart} from "victory"

const useStyles = makeStyles(theme => ({
  title: {
    padding:`32px ${theme.spacing(2.5)}px 2px`,
    color: '#2bbd7e',
    display:'inline'
  }
}))

/**When this component loads, we render a bar chart for expenses in the current year. We also add a DatePicker component to allow users to
select the desired year and retrieve data for that year with a button click. */
export default function Reports() {
    const classes = useStyles()
    const [error, setError] = useState('')
    const [year, setYear] = useState(new Date())
    const [yearlyExpense, setYearlyExpense] = useState([])
    const jwt = auth.isAuthenticated()
    const monthStrings = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    useEffect(() => {
      /**retrieve the initial yearly expense data with a useEffect hook
when the component loads. */
        const abortController = new AbortController()
        const signal = abortController.signal
        yearlyExpenses({year: year.getFullYear()},{t: jwt.token}, signal).then((data) => {
          if (data.error) {
            setError(data.error)
          }
            setYearlyExpense(data)
        })
        return function cleanup(){
          abortController.abort()
        }
    }, [])

    const handleDateChange = date => {
        setYear(date)
        yearlyExpenses({year: date.getFullYear()},{t: jwt.token}).then((data) => {
          if (data.error) {
            setError(data.error)
          }
            setYearlyExpense(data)
        })
    }
   
    return (
      <div>
          <Typography variant="h6" className={classes.title}>Your monthly expenditures in</Typography>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <DatePicker value={year} onChange={handleDateChange} views={["year"]}
                disableFuture
                label="Year"
                animateYearScrolling
                variant="inline"/>
          </MuiPickersUtilsProvider>
          {/* With the data received from the backend and set in the state, we can render it in a
Victory Bar chart */}
          <VictoryChart
                theme={VictoryTheme.material}
                domainPadding={10}
                height={300}
                width={450}>
                <VictoryAxis/>
                <VictoryBar
                    categories={{
                        x: monthStrings
                    }}
                    style={{ data: { fill: "#69f0ae", width: 20 }, labels: {fill: "#01579b"} }}
                    data={yearlyExpense.monthTot}
/**The month values returned from the database are zero-based indices, so we define our own array of month name strings to map to these indices. To render the bar chart,
we place a VictoryBar component in a VictoryChart component, giving us the flexibility to customize the bar chart wrapper, and also the y axis with
a VictoryAxis component, which is added without any props so that a y axis is not
displayed at all */
                    x={monthStrings['x']}
                    domain={{x: [0, 13]}}
                    labels={({ datum }) => `$${datum.y}`}
                />
          </VictoryChart>
      </div>
    )
  }