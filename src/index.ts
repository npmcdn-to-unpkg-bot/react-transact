import Task from './internals/Task'
import route from './decorators/route'
import _transact from './decorators/transact'
import taskCreator from './internals/taskCreator'
import RunContext from './components/RunContext'
import install from './install'
import {RUN_SCHEDULED_TASKS, SCHEDULE_TASKS, STANDALONE_INIT, SCHEDULED_TASKS_PENDING, SCHEDULED_TASKS_COMPLETED} from './actions'

const transact: any = _transact
transact.route = route

export {
  RUN_SCHEDULED_TASKS,
  SCHEDULE_TASKS,
  STANDALONE_INIT,
  SCHEDULED_TASKS_PENDING,
  SCHEDULED_TASKS_COMPLETED,
  transact,
  route,
  taskCreator,
  Task,
  RunContext,
  install
}

export default {
  RUN_SCHEDULED_TASKS,
  SCHEDULE_TASKS,
  STANDALONE_INIT,
  SCHEDULED_TASKS_PENDING,
  SCHEDULED_TASKS_COMPLETED,
  transact,
  route,
  taskCreator,
  Task,
  RunContext,
  install
}
