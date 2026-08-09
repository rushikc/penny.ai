import {expenseSlice} from '../../store/expenseSlice';
import {makeBudget} from '../fixtures/factories';

const {actions, reducer} = expenseSlice;

describe('budget redux reducers', () => {
  const base = reducer(undefined, {type: '@@init'});

  it('sets budget list', () => {
    const budgets = [makeBudget({id: 'a'}), makeBudget({id: 'b', name: 'Travel'})];
    expect(reducer(base, actions.setBudgetList(budgets)).budgetList).toEqual(budgets);
  });

  it('adds a budget', () => {
    const next = reducer(base, actions.addBudget(makeBudget({id: 'new'})));
    expect(next.budgetList).toHaveLength(1);
    expect(next.budgetList[0].id).toBe('new');
  });

  it('updates an existing budget or inserts when missing', () => {
    const seeded = reducer(base, actions.setBudgetList([makeBudget({id: 'a', amount: 100})]));
    const updated = reducer(
      seeded,
      actions.updateBudget(makeBudget({id: 'a', amount: 250, name: 'Updated'})),
    );
    expect(updated.budgetList[0]).toMatchObject({amount: 250, name: 'Updated'});

    const inserted = reducer(
      updated,
      actions.updateBudget(makeBudget({id: 'missing', name: 'Inserted'})),
    );
    expect(inserted.budgetList).toHaveLength(2);
  });

  it('deletes a budget by id', () => {
    const seeded = reducer(
      base,
      actions.setBudgetList([makeBudget({id: 'keep'}), makeBudget({id: 'drop'})]),
    );
    expect(reducer(seeded, actions.deleteBudget('drop')).budgetList.map(b => b.id)).toEqual([
      'keep',
    ]);
  });
});
