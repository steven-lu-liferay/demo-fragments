const debugMode = false;

/** click event handler for pagination section **/
function processPagination(evt) {
	let clickTarget = evt.target;
	const iterLimit = 5;
	let iterCount = 1;
	while(iterCount <= iterLimit) {
	
		if(debugMode) {
			console.log("iter: " + iterCount);
			console.log(clickTarget);
		}

		if(clickTarget.hasAttribute("pageNumber")) {
			pageNumberAttr = clickTarget.getAttribute("pageNumber");
			if(debugMode) console.log("pagination: " + pageNumberAttr);
			queryStrucContentDataPage(pageNumberAttr);
			break;
		}
		
		clickTarget = clickTarget.parentElement;
		iterCount++;		
	}
}


function queryStrucContentDataPage(pageNumber) {
	if(!pageNumber) {
		pageNumber = 1;
	}
		 
	/** get the filter data from the data element in the fragment **/
	const filterDataElem = fragmentElement.querySelector("data[name=filter-criteria]");
	let filterData = "";
	if(filterDataElem) {
		filterData = filterDataElem.getAttribute("value");
	}

	if(filterData != "") {
		filterData = "k eq '" + filterData + "'";
	}

	/** GraphQL query **/
	const graphQLQuery = `
		{
			contentStructureStructuredContents(
				contentStructureId:${configuration.structuredContentId}, 
				filter:"keywords/any(k:${filterData})",
				sort:"priority:desc,dateModified:desc",
				page:${pageNumber}, pageSize:${configuration.pageSize}) {
				totalCount
				page
				pageSize
				lastPage
				items {
					title
					keywords
					priority
					dateModified
					friendlyUrlPath
					contentFields {
						name
						label
						contentFieldValue {
							data
							image {
								id
								contentUrl
							}
						}

					}
				}
			}  
		}
	`;

	if(debugMode) console.log(graphQLQuery);
	
	let postBody = {
		"query": graphQLQuery
	};
	
	Liferay.Util.fetch(
		"/o/graphql", {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(postBody),
			method: 'POST'
		}
	)
	.then((response) => response.json()) 
	.then((data) => {
		if(debugMode) console.log(data);
		
		/** calculate the pagination **/
		const totalEntries = data.data.contentStructureStructuredContents.totalCount;
		const pageNumber = data.data.contentStructureStructuredContents.page;
		const entriesPerPage = data.data.contentStructureStructuredContents.pageSize;
		const totalPages = Math.ceil(totalEntries / entriesPerPage);
		
		const showingEntriesStart = (pageNumber-1) * entriesPerPage + 1;
		const showingEntriesEnd = Math.min(pageNumber * entriesPerPage, totalEntries);
		
		const showingEntriesNode = fragmentElement.querySelector(".paginated-struc-frag-showing-entries");
		showingEntriesNode.innerHTML = "Showing " + showingEntriesStart + " to " + showingEntriesEnd + " of " + totalEntries + " entries.";
		
		/** setup the pagination section **/
		const paginationULElement = fragmentElement.querySelector("ul.paginated-struc-frag-pagination-root");

		if(paginationULElement) {
			const prevNavArrowElement = paginationULElement.firstElementChild;
			const nextNavArrowElement = paginationULElement.lastElementChild;
						
			const paginationLIList = paginationULElement.children; 
			var paginationLIElement;
			
			for(let i = paginationLIList.length-1; i >= 0; i--) {
				paginationLIElement = paginationLIList.item(i);

				if(paginationLIElement != prevNavArrowElement && paginationLIElement != nextNavArrowElement) {
					//console.log("removing " + paginationLIElement.tagName);	
					paginationLIElement.remove();
				}
			}
			
			if(debugMode) console.log(pageNumber + " out of " + totalPages);

			if(pageNumber == 1) {
				prevNavArrowElement.classList.add("disabled");
				prevNavArrowElement.removeAttribute("onclick");
			}
			else {
				prevNavArrowElement.classList.remove("disabled");
				prevNavArrowElement.setAttribute("pageNumber", pageNumber-1);
				prevNavArrowElement.addEventListener("click", processPagination);
			}
			
			if(pageNumber == totalPages) {
				nextNavArrowElement.classList.add("disabled");
				nextNavArrowElement.removeAttribute("onclick");
			}
			else {
				nextNavArrowElement.classList.remove("disabled");
				nextNavArrowElement.setAttribute("pageNumber", pageNumber+1);
				nextNavArrowElement.addEventListener("click", processPagination);
			}
			
			var paginationNavElement;
			var navInsertAfterElement;
			var paginationNavButton;
			for(let i = 1; i <= totalPages; i++) {
				if(paginationNavElement) {
					navInsertAfterElement = paginationNavElement;
				}
				else {
					navInsertAfterElement = prevNavArrowElement;
				}
								
				paginationNavElement = document.createElement("li");
				paginationNavElement.classList.add("page-item");
				
				paginationNavButton = document.createElement("button");
				paginationNavButton.setAttribute("type", "button");
				paginationNavButton.classList.add("page-link");
				paginationNavButton.innerHTML = i;

				if(i == pageNumber) {
					paginationNavElement.classList.add("active");
					paginationNavButton.setAttributeNode(document.createAttribute("disabled"));
				}
				else {
					paginationNavElement.setAttribute("pageNumber", i);
					paginationNavElement.addEventListener("click", processPagination);
				}
				
				paginationNavElement.append(paginationNavButton);
				navInsertAfterElement.after(paginationNavElement);
			}
			
		}
		
		/** generate the display elements for each article **/
		const displayElement = fragmentElement.querySelector(".paginated-struc-frag-content-display");

		if(displayElement) {
			displayElement.innerHTML = "";
			const itemsList = data.data.contentStructureStructuredContents.items;
			
			/** get the path prefix to prepend to the friendly url **/
			const currentUrl = new URL(window.location.href);
			var currentUrlPaths = currentUrl.pathname.split('/');
			currentUrlPaths.pop();
			let currentAbsPath = currentUrl.protocol + "//" + currentUrl.hostname;
			if(currentUrl.hostname == "localhost") {
				currentAbsPath += ":8080";
			}

			currentAbsPath += currentUrlPaths.join('/') + "/w/";
			
/*
		Sample of HTML generated for each article content
		
		<div class="card">
			<div class="card-body row">
				<div class="col-md-3 col-sm-4 col-12 d-flex align-items-center">
					<img src="/documents/d/..." width="100%" height="auto">
				</div>
				<div class="col-md-9 col-sm-8 col-12 d-flex flex-column position-relative content-details">
					<div class="h4">Stephan's Quintet</div>
					<div class="p">
						The new image of galaxy group "Stephan's Quintet" from NASA's James Webb Space Telescope shows in rare detail how interacting galaxies trigger star formation in each other and how gas in galaxies is being disturbed. The image also shows outflows driven by a black hole in Stephan’s Quintet in a level of detail never seen before.
					</div>
					<div class="link content-link mt-3">
						<a href="https://url..." class="text-decoration-none text-info">Read More &gt;</a>
					</div>
				</div>
			</div>
		</div>

*/

			var cardElement, cardBodyElement;
			var contentSection1Element,imageElement;
			var contentSection2Element, titleElement, summaryElement, readMoreElement, contentLinkElement;
			var contentFieldsList;
			var contentImageUrl, contentSummary, contentFriendlyUrl;
			itemsList.forEach((contentItem) => {
				contentFriendlyUrl = contentItem.friendlyUrlPath;
				
				contentFieldsList = contentItem.contentFields;
				contentFieldsList.forEach((aContentField) => {
					if(aContentField.name == configuration.imageFieldName) {
						contentImageUrl = aContentField.contentFieldValue.image.contentUrl;
						//console.log("image url is " + aContentField.contentFieldValue.image.contentUrl);	
					}
					else if(aContentField.name == configuration.summaryFieldName) {
						contentSummary = aContentField.contentFieldValue.data;
					}
				});
				
				contentSection1Element = document.createElement("div");
				contentSection1Element.classList.add("col-md-3");
				contentSection1Element.classList.add("col-sm-4");
				contentSection1Element.classList.add("col-12");
				contentSection1Element.classList.add("d-flex");
				contentSection1Element.classList.add("align-items-center");
				
				imageElement = document.createElement("img");
				imageElement.setAttribute("src", contentImageUrl);
				imageElement.setAttribute("width", "100%");
				imageElement.setAttribute("height", "auto");
				
				contentSection1Element.append(imageElement);
				
				
				contentSection2Element = document.createElement("div");
				contentSection2Element.classList.add("col-md-9");
				contentSection2Element.classList.add("col-sm-8");
				contentSection2Element.classList.add("col-12");
				contentSection2Element.classList.add("d-flex");
				contentSection2Element.classList.add("flex-column");
				contentSection2Element.classList.add("position-relative");
				contentSection2Element.classList.add("content-details");
				
				titleElement = document.createElement("div");
				titleElement.classList.add("h4");
				titleElement.innerHTML = contentItem.title;
				
				contentSection2Element.append(titleElement);
				
				summaryElement = document.createElement("div");
				summaryElement.classList.add("p");
				summaryElement.innerHTML = contentSummary;
				
				contentSection2Element.append(summaryElement);

				readMoreElement = document.createElement("div");
				readMoreElement.classList.add("link");
				readMoreElement.classList.add("content-link");
				readMoreElement.classList.add("mt-3");
				
				contentLinkElement = document.createElement("a");
				contentLinkElement.setAttribute("href", currentAbsPath + contentFriendlyUrl);
				contentLinkElement.classList.add("text-decoration-none");
				contentLinkElement.classList.add("text-info");
				contentLinkElement.innerHTML = "Read More &gt;";
				
				readMoreElement.append(contentLinkElement);
				
				contentSection2Element.append(readMoreElement);

				
				cardElement = document.createElement("div");
				cardElement.classList.add("card");

				cardBodyElement = document.createElement("div");
				cardBodyElement.classList.add("card-body");
				cardBodyElement.classList.add("row");
				cardBodyElement.append(contentSection1Element);
				cardBodyElement.append(contentSection2Element);
				
				cardElement.append(cardBodyElement);
				
				displayElement.append(cardElement);
			});
		}
		
		
	})
	.catch((error) => {
		console.log(error);
	});
}

/** start with page 1 **/
queryStrucContentDataPage(1);

