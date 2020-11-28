import React, {useState, useEffect} from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import auth from '../auth/auth-helper'
import DateFnsUtils from '@date-io/date-fns'
import { DatePicker, MuiPickersUtilsProvider} from "@material-ui/pickers"
import {plotExpenses} from './../expense/api-expense.js'
import { VictoryTheme, VictoryScatter, VictoryChart, VictoryTooltip, VictoryLabel} from "victory"


const useStyles = makeStyles(theme => ({
  title: {
    padding:`32px ${theme.spacing(2.5)}px 2px`,
    color: '#2bbd7e',
    display:'inline'
  }
}))

export default function MonthlyScatter() {
    const classes = useStyles()
    const [error, setError] = useState('')
    const [plot, setPlot] = useState([])
    const [month, setMonth] = useState(new Date())
    const jwt = auth.isAuthenticated()
    /**When this component loads, we render a scatter chart for expenses in the current month. We also add a DatePicker component to
allow users to select the desired month and retrieve data for that month with a button click. */
//////////////////////////////////////////////////////////////////////////////////////////////////
/**we retrieve the initial scatter plot data with a useEffect hook */
    useEffect(() => {
        const abortController = new AbortController()
        const signal = abortController.signal

        plotExpenses({month: month},{t: jwt.token}, signal).then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            setPlot(data)
          }
        })
        return function cleanup(){
          abortController.abort()
        }
    }, [])
    const handleDateChange = date => {
        setMonth(date)
        plotExpenses({month: date},{t: jwt.token}).then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            setPlot(data)
          }
        })
    }

    return (
      <div style={{marginBottom: 20}}>
      <Typography variant="h6" className={classes.title}>Expenses scattered over </Typography> 
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
                 <DatePicker value={month} onChange={handleDateChange} views={["year", "month"]}
                 disableFuture
                    label="Month"
                    animateYearScrolling
                    variant="inline"/>
          </MuiPickersUtilsProvider>
          {/* When the plotted data is received from the backend and set in the state, we can
render it in a Victory Scatter chart. Additionally, we can add the following code in the
component view to render a customized scatter chart with labels */}
        <VictoryChart
        /**We place a VictoryScatter component in a VictoryChart component, giving us
the flexibility to customize the scatter chart wrapper and place axis label texts
outside the scatter chart */
                theme={VictoryTheme.material}
                height={400}
                width={550}
                domainPadding={40}
                >
                  {/* We pass the data to VictoryScatter, indicate which value
the bubble property is based on, customize the styles, and specify the size range and
labels for each bubble. */}
                    <VictoryScatter
                    /**This code plots and renders the scatter chart against the data provided with the
amount spent versus the day of the month on the y axis and x axis, respectively. */
                        style={{
                            data: { fill: "#01579b", stroke: "#69f0ae", strokeWidth: 2 },
                            labels: { fill: "#01579b", fontSize: 10, padding:8}
                        }}
                        bubbleProperty="y"
                        maxBubbleSize={15}
                        minBubbleSize={5}
                        labels={({ datum }) => `$${datum.y} on ${datum.x}th`}
                        labelComponent={<VictoryTooltip/>}
                        data={plot}
                        domain={{x: [0, 31]}}
                    />
                    <VictoryLabel
                      textAnchor="middle"
                      style={{ fontSize: 14, fill: '#8b8b8b' }}
                      x={270} y={390}
                      text={`day of month`}
                    />
                    <VictoryLabel
                      textAnchor="middle"
                      style={{ fontSize: 14, fill: '#8b8b8b' }}
                      x={6} y={190}
                      angle = {270} 
                      text={`Amount ($)`}
                    />
                </VictoryChart> 
        </div>
    )
  }