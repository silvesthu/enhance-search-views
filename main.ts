// main.ts
import { Plugin } from 'obsidian';

export default class FullPathSearchResultsPlugin extends Plugin {
	// We'll use a MutationObserver to watch for changes in the DOM,
	// specifically when search results are loaded or updated.
	private searchObserver: MutationObserver | null = null;

	async onload() {
		console.log('Loading Full Path Search Results plugin');

		// Wait until the Obsidian layout is ready before attempting to modify the DOM.
		// This ensures the search pane elements exist.
		this.app.workspace.onLayoutReady(() => {
			this.setupSearchObserver();
		});
	}

	onunload() {
		console.log('Unloading Full Path Search Results plugin');
		this.disconnectSearchObserver();
	}

	/**
	 * Sets up the MutationObserver to watch the search results container.
	 */
	private setupSearchObserver() {
		// Find the search results container. This CSS class is based on Obsidian's current DOM.
		// It might change in future Obsidian versions.
		const searchResultsContainer = document.querySelector('.search-results-children');

		if (searchResultsContainer) {
			this.searchObserver = new MutationObserver((mutationsList, observer) => {
				for (const mutation of mutationsList) {
					// Check if new nodes (search results) were added
					if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
						this.processSearchResults(mutation.addedNodes);
					}
				}
			});

			// Start observing for child list changes (new results being added)
			this.searchObserver.observe(searchResultsContainer, { childList: true, subtree: true });
			console.log('MutationObserver for search results set up.');

			// Also process existing results if the plugin loads after a search has already been performed
			this.processSearchResults(searchResultsContainer.querySelectorAll('.search-result'));
		} else {
			console.warn('Search results container not found. Plugin might not function correctly.');
			// Retry setup after a short delay if not found immediately, in case it's a timing issue
			setTimeout(() => this.setupSearchObserver(), 1000);
		}
	}

	/**
	 * Disconnects the MutationObserver to clean up resources.
	 */
	private disconnectSearchObserver() {
		if (this.searchObserver) {
			this.searchObserver.disconnect();
			this.searchObserver = null;
			console.log('MutationObserver for search results disconnected.');
		}
	}

	/**
	 * Processes a list of DOM nodes, adding file paths to search results.
	 * @param nodes The NodeList or Array of nodes to process.
	 */
	private processSearchResults(nodes: NodeListOf<Element> | Node[]) {

		// console.log('processSearchResults');

		nodes.forEach(node => {

			if (!(node instanceof Element))
				return;

			var element = node.querySelector('.search-result-file-title')
			if (!element)
				return;

			const proto = app.workspace.getLeaf(element);
			const origOpen = proto.openFile;

			// console.log("hook");
			// console.log(element);

			proto.openFile = function(file: TFile, ...args: any[]) {

				// console.log("restored");
				proto.openFile = origOpen;

				function extractParentFolder(path: string): string | null {
					const parts = path.split('/');
					if (parts.length >= 2) {
						return parts[parts.length - 2] + " / ";
					}
					return "";
				}

				// console.log(file.path);

				var innerElement = element.querySelector('.tree-item-inner');
				if (!innerElement.textContent.includes("/"))
					innerElement.textContent = extractParentFolder(file.path) + innerElement.textContent;
			};
			element.click();
		});
	}
}