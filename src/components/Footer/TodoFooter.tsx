import React from 'react';
import { Todo } from '../../types/Todo';

interface TodoFilterProps {
  setFilter: (filter: string) => void;
  filterType: string;
  deleteCompletedTodos: () => void;
  todos: Todo[];
}

export const TodoFooter: React.FC<TodoFilterProps> = ({
  setFilter,
  filterType,
  deleteCompletedTodos,
  todos,
}) => {
  const completedTodoExist = todos.some(todo => todo.completed);
  const todosLength = todos.filter(todo => !todo.completed).length;

  return (
    // /* Hide the footer if there are no todos */
    <footer className="todoapp__footer" data-cy="Footer">
      <span className="todo-count" data-cy="TodosCounter">
        {`${todosLength} items left`}
      </span>

      {/* /* Active link should have the 'selected' class */}
      <nav className="filter" data-cy="Filter">
        <a
          href="#/"
          className={`filter__link ${filterType === 'All' ? 'selected' : ''}`}
          data-cy="FilterLinkAll"
          onClick={() => setFilter('All')}
        >
          All
        </a>

        <a
          href="#/active"
          className={`filter__link ${filterType === 'Active' ? 'selected' : ''}`}
          data-cy="FilterLinkActive"
          onClick={() => setFilter('Active')}
        >
          Active
        </a>

        <a
          href="#/completed"
          className={`filter__link ${filterType === 'Completed' ? 'selected' : ''}`}
          data-cy="FilterLinkCompleted"
          onClick={() => setFilter('Completed')}
        >
          Completed
        </a>
      </nav>
      <button
        type="button"
        className="todoapp__clear-completed"
        data-cy="ClearCompletedButton"
        onClick={() => deleteCompletedTodos()}
        disabled={!completedTodoExist}
      >
        Clear completed
      </button>
    </footer>
  );
};
