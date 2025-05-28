/**
 * Class representing a cache for storing selections and showEmptyBranches flag.
 */
export default class Cache {
  // Default values
  static default_selections = [];
  static default_show_empty_branches = true;

  /**
   * Create a new Cache instance.
   * @param {string} source - The source for the cache | HEK, CCMC, RHESSI.
   */
  constructor(source) {
    this.selectionsKey = `helioviewer.events.selections.${source}`;
    this.showEmptyBranchesKey = `helioviewer.events.show_empty_branches.${source}`;
  }

  /**
   * Create a new Cache instance.
   * @param {string} source - The source for the cache| HEK, CCMC, RHESSI..
   * @returns {Cache} - A new Cache instance.
   */
  static make(source) {
    return new Cache(source);
  }

  /**
   * Retrieve selections from localStorage or initialize default.
   * @returns {Array} - The selections retrieved from localStorage.
   */
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

  /**
   * Save selections to localStorage.
   * @param {Array} selections - The selections to save.
   */
  saveSelections(selections) {
    try {
      localStorage.setItem(this.selectionsKey, JSON.stringify(selections));
    } catch (e) {
      console.error(`Failed to save ${this.selectionsKey}:`, e);
    }
  }

  /**
   * Retrieve showEmptyBranches flag from localStorage or initialize default.
   * @returns {boolean} - The showEmptyBranches flag retrieved from localStorage.
   */
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

  /**
   * Save showEmptyBranches flag to localStorage.
   * @param {boolean} flag - The showEmptyBranches flag to save.
   */
  saveShowEmptyBranches(flag) {
    try {
      localStorage.setItem(this.showEmptyBranchesKey, JSON.stringify(flag));
    } catch (e) {
      console.error(`Failed to save ${this.showEmptyBranchesKey}:`, e);
    }
  }
}
