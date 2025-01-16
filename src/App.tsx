/* eslint-disable max-len */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import { TodoList } from './components/TodoList/TodoList';
import { TodoFooter } from './components/Footer/TodoFooter';
import { TodoHeader } from './components/Header/TodoHeader';
import { TodoErrors } from './components/Errors/TodoErrors';
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';

export enum ErrorMessage {
  Update = 'Unable to update a todo',
  Add = 'Unable to add a todo',
  Delete = 'Unable to delete a todo',
  Get = 'Unable to load todos',
  Title = 'Title should not be empty',
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoTemp, setTodoTemp] = useState<Todo | null>(null);
  const [filter, setFilter] = useState('All');

  const [errorMessage, setErrorMessage] = useState('');

  const [newTodoTitle, setNewTodoTitle] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);

  useEffect(() => {
    setIsLoading(true);
    getTodos()
      .then(todosFromServer => setTodos(todosFromServer))
      .catch(err => {
        setErrorMessage(ErrorMessage.Get);
        throw err;
      })
      .finally(() => setIsLoading(false));
  }, []);

  const focusField = () => {
    setTimeout(() => {
      const inputField =
        document.querySelector<HTMLInputElement>('.todoapp__new-todo');

      inputField?.focus();
    }, 0);
  };

  const filterTodos = (filterType: string, todoList: Todo[]) => {
    switch (filterType) {
      case 'All':
        return todoList;
      case 'Active':
        return todoList.filter(todo => todo.completed === false);
      case 'Completed':
        return todoList.filter(todo => todo.completed === true);
      default:
        return todoList;
    }
  };

  const addTodo = async (
    event: React.FormEvent<HTMLFormElement>,
    title: string,
  ) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!title.trim()) {
      setIsLoading(false);
      setErrorMessage(ErrorMessage.Title);

      return;
    }

    setTodoTemp({
      title: title.trim(),
      userId: USER_ID,
      completed: false,
      id: 0,
    });

    try {
      const todo = await createTodo(title);

      setTodos([...todos, todo]);

      setNewTodoTitle('');
    } catch (error) {
      setErrorMessage(ErrorMessage.Add);
    } finally {
      setTimeout(() => {
        getTodos();
      }, 300);
      focusField();
      setIsLoading(false);
      setTodoTemp(null);
    }
  };

  const deleteTodoFunc = async (id: number) => {
    setErrorMessage('');
    setLoadingTodoIds(prevId => [...prevId, id]);
    try {
      const response = await deleteTodo(id);

      if (response === 1) {
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      } else {
        setErrorMessage(ErrorMessage.Delete);
      }
    } catch {
      setErrorMessage(ErrorMessage.Delete);
    } finally {
      focusField();
      setLoadingTodoIds([]);
    }
  };

  const deleteCompletedTodo = async () => {
    setErrorMessage('');
    try {
      const completedTodo = todos.filter(todo => todo.completed);

      const deletedResults = await Promise.all(
        completedTodo.map(async todo => {
          setLoadingTodoIds(prevIds => [...prevIds, todo.id]);
          try {
            const response = await deleteTodo(todo.id);

            return { id: todo.id, success: response === 1 };
          } catch {
            return { id: todo.id, success: false };
          } finally {
            setLoadingTodoIds(prevIds => prevIds.filter(id => id !== todo.id));
          }
        }),
      );

      const successfullDeletedTodos = deletedResults
        .filter(results => results.success)
        .map(results => results.id);

      setTodos(prevTodos =>
        prevTodos.filter(todo => !successfullDeletedTodos.includes(todo.id)),
      );

      const hasFailsDeleted = deletedResults.some(result => !result.success);

      if (hasFailsDeleted) {
        setErrorMessage(ErrorMessage.Delete);
      }
    } catch {
      setErrorMessage(ErrorMessage.Delete);
    } finally {
      focusField();
    }
  };

  const updateStatusTodo = async (id: number) => {
    setErrorMessage('');
    setLoadingTodoIds(prevId => [...prevId, id]);

    const todoToChange = todos.find(todo => todo.id === id);

    if (!todoToChange) {
      setErrorMessage(ErrorMessage.Update);

      return;
    }

    const updatedTodo = { ...todoToChange, completed: !todoToChange.completed };

    try {
      await updateTodo(id, updatedTodo);

      setTodos(prevTodos =>
        prevTodos.map(todo => (todo.id === id ? updatedTodo : todo)),
      );
    } catch {
      setErrorMessage(ErrorMessage.Update);
    } finally {
      setLoadingTodoIds([]);
    }
  };

  const updateStatusAllTodos = async () => {
    setErrorMessage('');
    try {
      const hasCompletedTodo = todos.some(todo => !todo.completed);
      const newStatus = hasCompletedTodo;
      const todosToUpdate = todos.filter(todo => todo.completed !== newStatus);

      const changeAllTodoStatus = await Promise.all(
        todosToUpdate.map(async todo => {
          setLoadingTodoIds(prevIds => [...prevIds, todo.id]);
          const updatedTodo = { ...todo, completed: newStatus };

          await updateTodo(todo.id, updatedTodo);

          setLoadingTodoIds(prevIds => prevIds.filter(id => id !== todo.id));

          return updatedTodo;
        }),
      );

      setTodos(prevTodos =>
        prevTodos.map(todo => {
          const updatedTodo = changeAllTodoStatus.find(
            updated => updated.id === todo.id,
          );

          return updatedTodo || todo;
        }),
      );
    } catch {
      setErrorMessage(ErrorMessage.Update);
    }
  };

  const changeTodoTitle = async (id: number, newTitle: string) => {
    setErrorMessage('');
    setLoadingTodoIds(prevIds => [...prevIds, id]);

    if (!newTitle.trim()) {
      deleteTodoFunc(id);

      return;
    }

    try {
      const todoToUpdate = {
        ...todos.find(todo => todo.id === id),
        title: newTitle,
      };

      await updateTodo(id, todoToUpdate);

      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id ? { ...todo, title: newTitle } : todo,
        ),
      );
    } catch {
      setErrorMessage(ErrorMessage.Update);
    } finally {
      setLoadingTodoIds([]);
    }
  };

  const visibleTodos = filterTodos(filter, todos);

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <section className="section container">
      <div className="todoapp">
        <h1 className="todoapp__title">todos</h1>
        <div className="todoapp__content">
          <TodoHeader
            onUpdateError={setErrorMessage}
            onSetNewTodoTitle={setNewTodoTitle}
            newTodoTitle={newTodoTitle}
            addTodo={addTodo}
            isLoading={isLoading}
            todos={todos}
            updateStatusAllTodos={updateStatusAllTodos}
          />
          <section className="todoapp__main" data-cy="TodoList">
            <TodoList
              todos={visibleTodos}
              deleteTodo={deleteTodoFunc}
              todoTemp={todoTemp}
              todoIds={loadingTodoIds}
              updateStatusTodo={updateStatusTodo}
              onChangeTitle={changeTodoTitle}
            />
          </section>
          {todos.length !== 0 && (
            <TodoFooter
              setFilter={setFilter}
              filterType={filter}
              deleteCompletedTodos={deleteCompletedTodo}
              todos={todos}
            />
          )}
        </div>
        <TodoErrors errors={errorMessage} onUpdateError={setErrorMessage} />
      </div>
    </section>
  );
};
