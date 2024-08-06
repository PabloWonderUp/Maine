$(document).ready(function () {
  function showFilters() {
    var $filters = $(".search-panel__filters");
    $filters.css("display", "flex");
    setTimeout(function () {
      $filters.addClass("active");
    }, 10);
  }

  function hideFilters() {
    var $filters = $(".search-panel__filters");
    $filters.removeClass("active");
    setTimeout(function () {
      $filters.css("display", "none");
    }, 500);
  }
  $(".search_filters-button").click(showFilters);

  $(".search-panel_header").click(hideFilters);
  $(".search-submit.is-refinament").click(hideFilters);
});
const INDEX = "restaurants";
const instantSearchRouter = historyRouter();

// Function to generate price symbols
function generatePriceSymbols(value) {
  if (isNaN(value) || value < 0 || value > 3) {
    return "";
  }

  let activeSymbols = Math.min(value, 3); // Ensure activeSymbols does not exceed 3
  let inactiveSymbols = 3 - activeSymbols;

  return [
    ...Array(activeSymbols).fill('<span class="pricing-icon-active">$</span>'),
    ...Array(inactiveSymbols).fill(
      '<span class="pricing-icon-inactive">$</span>'
    ),
  ].join("");
}

// Function to generate star icons
function refinementStar(value) {
  return `${value} <svg width="100%" height="100%" class="refinement-star" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 0L9.18386 5.18237H14.6329L10.2245 8.38525L11.9084 13.5676L7.5 10.3647L3.09161 13.5676L4.77547 8.38525L0.367076 5.18237H5.81614L7.5 0Z" fill="currentColor"/>
</svg>
`;
}
function updateActiveRefinementsCount(items) {
  const activeRefinementsElement = document.querySelector(
    ".active-refinements"
  );
  if (activeRefinementsElement) {
    const count = items.reduce((acc, item) => acc + item.refinements.length, 0);
    activeRefinementsElement.textContent = count;
  }
}

//Tags plugin
function countTags() {
  const tagsList = document.querySelector(".aa-TagsList");
  if (tagsList) {
    const tags = tagsList.querySelectorAll(".aa-Tag");
    return tags.length;
  } else {
    return 0;
  }
}
//Geosearch
let selectedDistance = null;

function updateSearch() {
  if (selectedDistance) {
    search.helper.setQueryParameter("aroundRadius", selectedDistance);
  } else {
    search.helper.setQueryParameter("aroundRadius", undefined);
  }
  search.helper.search();
}

function refineDistance(value) {
  selectedDistance = parseFloat(value) * 1609.34; // Miles to meters
  updateSearch();
}

function initializeAlgolia() {
  const search = instantsearch({
    searchClient,
    indexName: INDEX,
    //facets: ['Name', 'Type'],
    routing: instantSearchRouter,
    insights: true,
    searchParameters: {
      aroundLatLng: "45.018468, -68.954001",
    },
  });

  // Current refinement widget
  const createDataAttribtues = (refinement) =>
    Object.keys(refinement)
      .map((key) => `data-${key}="${refinement[key]}"`)
      .join(" ");

  const renderListItem = (item) => {
    if (item.label === "Stars") {
      return `
<div class="currentRefinamentList">
${item.refinements
  .map(
    (refinement) =>
      `<div class="currenteRefinamentItem" >
${refinementStar(refinement.label)}
<button ${createDataAttribtues(refinement)} class="currenteRefinamentItemClose">
<svg width="100%" height="100%" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.999 12.5003L1.99963 2.5009" stroke="currentColor" stroke-width="1.25"/>
<path d="M12 2.50027L2 12.499" stroke="currentColor" stroke-width="1.25"/>
  </svg>
  </button>
  </div>`
  )
  .join("")}
  </div>
`;
    } else if (item.label === "Price range") {
      return `
<div class="currentRefinamentList" >
${item.refinements
  .map(
    (refinement) =>
      `<div  class="currenteRefinamentItem" >
${generatePriceSymbols(refinement.label)}
<button ${createDataAttribtues(
        refinement
      )} class="currenteRefinamentItemClose" >
<svg width="100%" height="100%" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.999 12.5003L1.99963 2.5009" stroke="currentColor" stroke-width="1.25"/>
<path d="M12 2.50027L2 12.499" stroke="currentColor" stroke-width="1.25"/>
  </svg>
  </button>
  </div>`
  )
  .join("")}
  </div>
`;
    }
    return `
<div class="currentRefinamentList">
${item.refinements
  .map(
    (refinement) =>
      `<div  class="currenteRefinamentItem" >
${refinement.label}
<button ${createDataAttribtues(refinement)} class="currenteRefinamentItemClose">
<svg width="100%" height="100%" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.999 12.5003L1.99963 2.5009" stroke="currentColor" stroke-width="1.25"/>
<path d="M12 2.50027L2 12.499" stroke="currentColor" stroke-width="1.25"/>
  </svg>
  </button>
  </div>`
  )
  .join("")}
  </div>
`;
  };

  const renderCurrentRefinements = (renderOptions, isFirstRender) => {
    const { items, refine, widgetParams } = renderOptions;

    widgetParams.container.innerHTML = `
<ul class="currentRefinementsComponent">
${items.map(renderListItem).join("")}
  </ul>
`;

    [...widgetParams.container.querySelectorAll("button")].forEach(
      (element) => {
        element.addEventListener("click", (event) => {
          const item = Object.keys(event.currentTarget.dataset).reduce(
            (acc, key) => ({
              ...acc,
              [key]: event.currentTarget.dataset[key],
            }),
            {}
          );

          refine(item);
        });
      }
    );
    updateActiveRefinementsCount(items);
  };

  // Create the custom widget
  const customCurrentRefinements = connectCurrentRefinements(
    renderCurrentRefinements
  );

  // Tags Plugin
  const tagsPlugin = createTagsPlugin({
    getTagsSubscribers() {
      return [
        {
          sourceId: "restaurants",
          getTag({ item }) {
            return { label: item.Name, ...item };
          },
        },
      ];
    },
    transformSource() {
      return undefined;
    },
    onChange({ tags, setIsOpen, setQuery }) {
      requestAnimationFrame(() => {
        const container = document.querySelector(".aa-InputWrapperPrefix");
        const oldTagsContainer = document.querySelector(".aa-Tags");

        const tagsContainer = document.createElement("div");
        tagsContainer.classList.add("aa-Tags");
        setQuery("");
        updateSearchStateWithTags(tags);
        render(
          createElement(
            "div",
            { className: "aa-TagsList" },
            ...tags.map(({ label, remove }) =>
              createElement(
                "div",
                { className: "aa-Tag", key: label },
                createElement(
                  "span",
                  {
                    className: "aa-TagLabel",
                  },
                  label
                ),
                createElement(
                  "button",
                  {
                    className: "aa-TagRemoveButton",
                    onClick: () => {
                      remove();
                      setQuery("");
                      updateSearchStateWithTags(
                        tags.filter((tag) => tag.label !== label)
                      );
                      requestAnimationFrame(() => setIsOpen(true));
                    },
                    title: "Remove this tag",
                  },
                  createElement(
                    "svg",
                    {
                      width: 14,
                      height: 15,
                      viewBox: "0 0 14 15",
                      fill: "none",
                      xmlns: "http://www.w3.org/2000/svg",
                    },
                    createElement("path", {
                      d: "M11.9995 12.5003L2.00012 2.5009",
                      stroke: "#FAF7F1",
                      strokeWidth: 1.25,
                    }),
                    createElement("path", {
                      d: "M12 2.50027L2 12.499",
                      stroke: "#FAF7F1",
                      strokeWidth: 1.25,
                    })
                  )
                )
              )
            )
          ),
          tagsContainer
        );

        if (oldTagsContainer) {
          container.removeChild(oldTagsContainer);
        }
        setQuery("");
        container.appendChild(tagsContainer);
      });
      const searchInput = document.querySelector(".aa-Input");

      searchInput.addEventListener("keydown", (event) => {
        if (
          event.key === "Backspace" &&
          searchInput.selectionStart === 0 &&
          searchInput.selectionEnd === 0
        ) {
          const newTags = tagsPlugin.data.tags.slice(0, -1);
          tagsPlugin.data.setTags(newTags);
        }
      });
      setQuery("");
      updateSearchStateWithTags(tags);
    },
  });

  const updateSearchStateWithTags = (tags) => {
    if (Array.isArray(tags) && tags.length > 0) {
      const filters = tags.map((tag) => tag.label).join(" OR ");
      setInstantSearchUiState({ query: filters });
    }
  };

  //Infinite scroll
  const infiniteHits = instantsearch.connectors.connectInfiniteHits(
    (renderArgs, isFirstRender) => {
      const { hits, showMore, widgetParams } = renderArgs;
      const { container } = widgetParams;

      if (isFirstRender) {
        const ul = document.createElement("ul");
        ul.className = "ais-Hits-list";
        container.appendChild(ul);

        const sentinel = document.createElement("div");
        sentinel.id = "sentinel";
        container.appendChild(sentinel);

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              showMore();
            }
          });
        });

        observer.observe(sentinel);
        return;
      }

      const ul = container.querySelector("ul");
      hits.forEach((hit) => {
        const li = document.createElement("li");
        li.className = "ais-Hits-item";
        li.innerHTML = `
              <a href="${createLink("restaurants/" + hit.Slug)}">
                <div class="card-image-wrapper">
                  <img class="card-image" src="${
                    hit["Main Image"]
                      ? hit["Main Image"]
                      : "https://uploads-ssl.webflow.com/6638e2cff0f7820ea919dcbe/6639335a592d50e740330397_card-bg-shape-orange.png"
                  }" alt="${hit.Name}" />
                </div>
                <div class="card-header">
                  <p class="card-tagline">${hit["Destination Name"]}</p>
                  <h4 class="card-title text-style-2lines">${hit.Name}</h4>
                </div>
                <div class="card-rating-wrapper">
                  <div class="card-rating">
                    ${generateStars(hit.Stars)}
                  </div>
                  <div class="card-reviews">
                    (21)                
                  </div>  
                </div>
              </a>
            `;
        ul.appendChild(li);
      });
    }
  );

  // Set a Virtual Search Box
  const virtualSearchBox = connectSearchBox(() => {});

  search.addWidgets([
    virtualSearchBox({}),
    geoSearch({
      container: "#maps",
      googleReference: window.google,
      initialZoom: 4,
      initialPosition: {
        lat: 45.018468,
        lng: -68.954001,
      },
      builtInMarker: {
        createOptions(item) {
          return {
            position: {
              lat: item._geoloc.lat,
              lng: item._geoloc.lng,
            },
            icon: {
              url: item.Marker,
              scaledSize: new window.google.maps.Size(32, 32),
            },
          };
        },
        events: {
          click({ event, item, marker, map }) {
            setInstantSearchUiState({ query: item.Name });
            setQuery(item.Name);
          },
        },
      },
    }),
    /*  instantsearch.widgets.hits({
        container: '#hits',
        templates: {
          item: (hit, { html, components }) => {
            return `
<a href="${createLink('restaurants/'+hit.Slug)}">
<div class="card-image-wrapper">
<img class="card-image" src="${hit['Main Image'] ? hit['Main Image'] : "https://uploads-ssl.webflow.com/6638e2cff0f7820ea919dcbe/6639335a592d50e740330397_card-bg-shape-orange.png"}" alt="${hit.Name}" />
  </div>
<div class="card-header">
<p class="card-tagline">${hit["Destination Name"]}</p>
<h4 class="card-title text-style-2lines">${hit.Name}</h4>
  </div>
<div class="card-rating-wrapper">
<div class="card-rating">
${generateStars(hit.Stars)}
  </div>
<div class="card-reviews">
(21)                
  </div>  
  </div>
  </a>
`;
          },
        },
      }),  */
    instantsearch.widgets.configure({
      hitsPerPage: 8,
      maxValuesPerFacet: 1000,
      filters: "",
    }),
    instantsearch.widgets.panel({
      templates: { header: "Distance range" },
    })(instantsearch.widgets.refinementList)({
      container: "#distance-range",
      attribute: "custom_distance",
      cssClasses: {
        label: "hidden-checkbox",
      },
      transformItems(items) {
        const staticFacets = [
          {
            label: "Within 0.25 miles",
            value: "0.25",
            count: 0,
            isRefined: false,
          },
          {
            label: "Within 0.5 miles",
            value: "0.5",
            count: 0,
            isRefined: false,
          },
          { label: "Within 1 mile", value: "1", count: 0, isRefined: false },
          { label: "Within 2 miles", value: "2", count: 0, isRefined: false },
          { label: "Within 3 miles", value: "3", count: 0, isRefined: false },
          { label: "Within 5 miles", value: "5", count: 0, isRefined: false },
          { label: "Within 10 miles", value: "10", count: 0, isRefined: false },
          { label: "Within 20 miles", value: "20", count: 0, isRefined: false },
          { label: "Within 30 miles", value: "30", count: 0, isRefined: false },
          { label: "Within 40 miles", value: "40", count: 0, isRefined: false },
          { label: "Within 50 miles", value: "50", count: 0, isRefined: false },
        ];

        const allFacets = [...staticFacets, ...items];
        const uniqueFacets = Array.from(
          new Map(allFacets.map((item) => [item.label, item])).values()
        );

        return uniqueFacets;
      },
      templates: {
        item: (item) => `
<label class="ais-RefinementList-label">
<input type="radio" style="display:none" name="distance" value="${
          item.value
        }" ${item.isRefined ? "checked" : ""} onchange="refineDistance('${
          item.value
        }')">
<span class="ais-RefinementList-labelText">
${item.label}
  </span>
  </label>
`,
      },
    }),
    instantsearch.widgets.dynamicWidgets({
      container: "#dynamic-widgets",
      maxValuesPerFacet: 30,
      fallbackWidget({ container, attribute }) {
        return instantsearch.widgets.panel({
          templates: { header: () => attribute },
        })(instantsearch.widgets.refinementList)({
          container,
          attribute,
        });
      },
      widgets: [
        (container) =>
          instantsearch.widgets.panel({
            templates: { header: () => "Stars" },
          })(instantsearch.widgets.refinementList)({
            container,
            attribute: "Stars",
            cssClasses: {
              label: "hidden-checkbox",
            },
            transformItems(items) {
              const staticFacets = [
                { label: "1", value: "1", count: 0, isRefined: false },
                { label: "2", value: "2", count: 0, isRefined: false },
                { label: "3", value: "3", count: 0, isRefined: false },
                { label: "4", value: "4", count: 0, isRefined: false },
                { label: "5", value: "5", count: 0, isRefined: false },
              ];

              // Redondear los valores de Stars y agruparlos
              const roundedItems = items.map((item) => {
                const roundedValue = Math.round(parseFloat(item.value));
                return {
                  ...item,
                  label: roundedValue.toString(),
                  value: roundedValue.toString(),
                };
              });

              // Agrupar los counts por valor redondeado
              const groupedItems = roundedItems.reduce((acc, item) => {
                const existingItem = acc.find((i) => i.value === item.value);
                if (existingItem) {
                  existingItem.count += item.count;
                } else {
                  acc.push(item);
                }
                return acc;
              }, []);

              // Combine static facets with grouped dynamic facets
              const allFacets = [...staticFacets, ...groupedItems];

              // Remove duplicates, prioritizing dynamic facets
              const uniqueFacets = Array.from(
                new Map(allFacets.map((item) => [item.label, item])).values()
              );

              return uniqueFacets;
            },
            templates: {
              item: (item) => `
          <label class="ais-RefinementList-label">
          <input type="checkbox" value="${item.value}" ${
                item.isRefined ? "checked" : ""
              } style="display: none;">
          <span class="ais-RefinementList-labelTextIcon">
          ${refinementStar(item.label)}
            </span>
            </label>
          `,
            },
          }),
        (container) =>
          instantsearch.widgets.panel({
            templates: { header: () => "Type name" },
          })(instantsearch.widgets.refinementList)({
            container,
            attribute: "Type",
          }),
        (container) =>
          instantsearch.widgets.panel({
            templates: { header: () => "Cuisine" },
          })(instantsearch.widgets.refinementList)({
            container,
            attribute: "Cuisines",
            limit: 100,
          }),
        (container) =>
          instantsearch.widgets.panel({
            templates: { header: () => "Price range" },
          })(instantsearch.widgets.refinementList)({
            container,
            attribute: "Price range",
            cssClasses: {
              label: "hidden-checkbox",
            },
            transformItems(items) {
              const staticFacets = [
                { label: "1", value: "1", count: 0, isRefined: false },
                { label: "2", value: "2", count: 0, isRefined: false },
                { label: "3", value: "3", count: 0, isRefined: false },
              ];

              // Combine static facets with dynamic facets from Algolia
              const allFacets = [...staticFacets, ...items];

              // Remove duplicates, prioritizing dynamic facets
              const uniqueFacets = Array.from(
                new Map(allFacets.map((item) => [item.label, item])).values()
              );

              return uniqueFacets;
            },
            templates: {
              item: (item) => {
                return `
<label class="ais-RefinementList-label">
<input type="checkbox" value="${item.value}" ${
                  item.isRefined ? "checked" : ""
                } style="display: none;">
<span class="ais-RefinementList-labelText">
${generatePriceSymbols(parseInt(item.label))}
  </span>
  </label>
`;
              },
            },
          }),
      ],
    }),
    instantsearch.widgets.clearRefinements({
      container: "#clear-refinements",
      templates: {
        resetLabel({}, { html }) {
          return html`
            <div class="search-panel_reset-icon">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 18 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 16L8.5 18.5981L8.5 13.4019L13 16Z"
                  fill="#203500"
                />
                <path
                  d="M16 9C16 5.13401 12.866 2 9 2C5.13401 2 2 5.13401 2 9C2 12.866 5.13401 16 9 16"
                  stroke="#203500"
                  stroke-width="2"
                />
              </svg>
            </div>
            <span>Reset</span>
          `;
        },
      },
    }),
  ]);
  search.addWidgets([
    customCurrentRefinements({
      container: document.querySelector("#current-refinements"),
    }),
  ]);
  search.addWidgets([
    infiniteHits({
      container: document.querySelector("#hits"),
    }),
  ]);

  search.start();

  // Set the InstantSearch index UI state from external events.
  function setInstantSearchUiState(indexUiState) {
    console.log("Setting UI state:", indexUiState);
    search.setUiState((uiState) => ({
      ...uiState,
      [INDEX]: {
        ...uiState[INDEX],
        // We reset the page when the search state changes.
        page: 1,
        ...indexUiState,
      },
    }));
  }

  // Return the InstantSearch index UI state.
  function getInstantSearchUiState() {
    const uiState = instantSearchRouter.read();
    return (uiState && uiState[INDEX]) || {};
  }

  const searchPageState = getInstantSearchUiState();

  let skipInstantSearchUiStateUpdate = false;
  const { setQuery } = autocomplete({
    container: "#autocomplete",
    placeholder: "Search by location or zipcode",
    detachedMediaQuery: "none",
    plugins: [tagsPlugin],
    getSources({ query, state }) {
      if (!query) {
        return [];
      }
      return [
        {
          sourceId: "restaurants",
          getItems() {
            return getAlgoliaResults({
              searchClient,
              queries: [
                {
                  indexName: INDEX,
                  query,
                  params: {
                    attributesToSnippet: ["Name:10", "Description:35"],
                    snippetEllipsisText: "…",
                    hitsPerPage: 5,
                  },
                },
              ],
            });
          },
          templates: {
            item({ item, components, html }) {
              return html`<div class="aa-ItemLink">
                <div class="aa-ItemContent">
                  <div class="aa-ItemIcon aa-ItemIcon--alignTop">
                    <div class="panel-icon-wrapper">
                      <img
                        class="panel-icon"
                        src="https://uploads-ssl.webflow.com/6638e2cff0f7820ea919dcbe/6661ef05dd64c5bc9ad41066_Icon%3DLocation.svg"
                      />
                    </div>
                  </div>
                  <div class="aa-ItemContentBody">
                    <div class="aa-ItemContentTitle">${item.Name}</div>
                    <div class="aa-ItemContentSubtitle">
                      ${item["Destination Name"]}
                    </div>
                  </div>
                </div>
              </div>`;
            },
            noResults() {
              return "No results for this query.";
            },
          },
          getItemUrl({ item }) {
            return "/restaurants/" + item.Slug;
          },
        },
      ];
    },
    initialState: {
      query: searchPageState.query || "",
    },
    onSubmit({ state }) {
      setInstantSearchUiState({ query: state.query });
    },
    onReset() {
      setInstantSearchUiState({ query: "" });
    },
    onStateChange({ prevState, state }) {
      if (countTags() > 1) {
        updateSearchStateWithTags(state.query);
      }
    },
  });

  window.addEventListener("popstate", () => {
    skipInstantSearchUiStateUpdate = true;
    setQuery(search.helper?.state.query || "");
  });

  //Customize Button
  const formElement = document.querySelector(".aa-Form");

  // Define the new div with the button as a string
  const divString = `
<div class="map_button" style="position: absolute; right: 0;height:100%">
<button class="ais-SearchBox-submit search-submit" type="submit" title="Submit the search query">Explore</button>
  </div>
`;

  // Create a temporary container for the div
  const tempDivContainer = document.createElement("div");
  tempDivContainer.innerHTML = divString;

  // Get the div element from the temporary container
  const divElement = tempDivContainer.firstElementChild;

  // Append the new div to the .aa-Form element
  formElement.appendChild(divElement);
  // Select the button
  const button = document.querySelector(".aa-SubmitButton");
  // Remove the current icon with the class .aa-SubmitIcon
  const currentIcon = button.querySelector(".aa-SubmitIcon");
  if (currentIcon) {
    currentIcon.remove();
  }

  // Define the SVG as a string
  const svgString = `
<svg width=" 100%" height=" 100%" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="path-1-inside-1_8881_15007" fill="currentColor">
<path fill-rule="evenodd" clip-rule="evenodd" d="M2 6.80609C2 3.04719 5.13401 0 9 0C12.866 0 16 3.04719 16 6.80609C16 8.63483 15.4615 9.94737 14.3846 11.518L9 18L3.61538 11.518C2.53846 9.94737 2 8.63483 2 6.80609ZM9 10C10.6569 10 12 8.65685 12 7C12 5.34315 10.6569 4 9 4C7.34315 4 6 5.34315 6 7C6 8.65685 7.34315 10 9 10Z"/>
  </mask>
<path fill-rule="evenodd" clip-rule="evenodd" d="M2 6.80609C2 3.04719 5.13401 0 9 0C12.866 0 16 3.04719 16 6.80609C16 8.63483 15.4615 9.94737 14.3846 11.518L9 18L3.61538 11.518C2.53846 9.94737 2 8.63483 2 6.80609ZM9 10C10.6569 10 12 8.65685 12 7C12 5.34315 10.6569 4 9 4C7.34315 4 6 5.34315 6 7C6 8.65685 7.34315 10 9 10Z" fill="currentColor"/>
<path d="M14.3846 11.518L15.923 12.796L15.982 12.7251L16.0341 12.649L14.3846 11.518ZM9 18L7.46157 19.278L9 21.1299L10.5384 19.278L9 18ZM3.61538 11.518L1.96589 12.649L2.01803 12.7251L2.07695 12.796L3.61538 11.518ZM9 -2C4.08277 -2 0 1.89003 0 6.80609H4C4 4.20435 6.18524 2 9 2V-2ZM18 6.80609C18 1.89003 13.9172 -2 9 -2V2C11.8148 2 14 4.20435 14 6.80609H18ZM16.0341 12.649C17.2671 10.8508 18 9.14986 18 6.80609H14C14 8.1198 13.656 9.04393 12.7351 10.387L16.0341 12.649ZM10.5384 19.278L15.923 12.796L12.8462 10.24L7.46157 16.722L10.5384 19.278ZM2.07695 12.796L7.46157 19.278L10.5384 16.722L5.15382 10.24L2.07695 12.796ZM0 6.80609C0 9.14986 0.732934 10.8508 1.96589 12.649L5.26488 10.387C4.34399 9.04393 4 8.1198 4 6.80609H0ZM10 7C10 7.55229 9.55229 8 9 8V12C11.7614 12 14 9.76142 14 7H10ZM9 6C9.55228 6 10 6.44772 10 7H14C14 4.23858 11.7614 2 9 2V6ZM8 7C8 6.44772 8.44772 6 9 6V2C6.23858 2 4 4.23858 4 7H8ZM9 8C8.44772 8 8 7.55228 8 7H4C4 9.76142 6.23858 12 9 12V8Z" fill="currentColor" mask="url(#path-1-inside-1_8881_15007)"/>
  </svg>
`;

  // Create a temporary container for the SVG
  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = svgString;

  // Get the SVG from the temporary container
  const svgElement = tempContainer.firstElementChild;

  // Add the .aa-SubmitIcon class to the SVG
  svgElement.classList.add("aa-SubmitIcon");

  // Append the SVG to the button
  button.appendChild(svgElement);
}

function loadGoogleMapsAPI() {
  if (typeof window.google === "undefined") {
    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDlPRak0SL63kzs6RqKUAaQ4Bc6oCiLKFM&callback=initializeAlgolia";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  } else {
    initializeAlgolia();
  }
}

loadGoogleMapsAPI();
