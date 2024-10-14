import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Rule {
  pattern: string;
  businessId: string;
}

interface RuleStore {
  rules: Rule[];
  addRule: (rule: Rule) => void;
  removeRule: (pattern: string) => void;
  updateRule: (oldPattern: string, newRule: Rule) => void;
}

export const useRuleStore = create<RuleStore>()(
  persist(
    (set) => ({
      rules: [],
      addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),
      removeRule: (pattern) => set((state) => ({ rules: state.rules.filter(r => r.pattern !== pattern) })),
      updateRule: (oldPattern, newRule) => set((state) => ({
        rules: state.rules.map(r => r.pattern === oldPattern ? newRule : r)
      })),
    }),
    {
      name: 'rule-storage',
    }
  )
);
