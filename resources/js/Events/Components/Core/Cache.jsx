export default class Cache {
  // Default values
  static default_selections = [];
  static default_show_empty_branches = true;

  constructor(source) {
    this.selectionsKey = `helioviewer.events.selections.${source}`;
    this.showEmptyBranchesKey = `helioviewer.events.show_empty_branches.${source}`;
  }

  static make(source) {
    return new Cache(source);
  }

  // Retrieve selections from localStorage or initialize default
  getSelections() {
    const raw = localStorage.getItem(this.selectionsKey);
    if (raw === null) {
      this.saveSelections(Cache.default_selections);
      return Cache.default_selections;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Failed to parse ${this.selectionsKey}:`, e);
      this.saveSelections(Cache.default_selections);
      return Cache.default_selections;
    }
  }

  // Save selections to localStorage
  saveSelections(selections) {
    try {
      localStorage.setItem(this.selectionsKey, JSON.stringify(selections));
    } catch (e) {
      console.error(`Failed to save ${this.selectionsKey}:`, e);
    }
  }

  // Retrieve showEmptyBranches flag or initialize default
  getShowEmptyBranches() {
    const raw = localStorage.getItem(this.showEmptyBranchesKey);
    if (raw === null) {
      this.saveShowEmptyBranches(Cache.default_show_empty_branches);
      return Cache.default_show_empty_branches;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Failed to parse ${this.showEmptyBranchesKey}:`, e);
      this.saveShowEmptyBranches(Cache.default_show_empty_branches);
      return Cache.default_show_empty_branches;
    }
  }

  // Save showEmptyBranches flag to localStorage
  saveShowEmptyBranches(flag) {
    try {
      localStorage.setItem(this.showEmptyBranchesKey, JSON.stringify(flag));
    } catch (e) {
      console.error(`Failed to save ${this.showEmptyBranchesKey}:`, e);
    }
  }
}
