const imgElem = fragmentElement.querySelector('img');
if(imgElem) {
	const fileEntryId = imgElem.getAttribute('data-fileentryid');
	
	const mappedDocTitle = fragmentElement.querySelector('div.mappable-doc-title');
	if(mappedDocTitle) {
		const docTitle = mappedDocTitle.innerHTML.trim();	
		
		const acSpan = fragmentElement.querySelector('span[data-analytics-asset-id]');
		if(acSpan) {
			console.log(`setting file entry id: ${fileEntryId}, doc title: ${docTitle}`);

			acSpan.setAttribute('data-analytics-asset-id', fileEntryId);
			acSpan.setAttribute('data-analytics-asset-title', docTitle);
		}
	}
}