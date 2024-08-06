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

const INDEX = "destinations";
const instantSearchRouter = historyRouter();
function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}
// Function to generate price symbols
function generatePriceSymbols(value) {
  if (isNaN(value) || value < 0 || value > 3) {
    console.error("Invalid value for price symbols:", value);
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

const destination = getQueryParameter("destination");

// Initialize Algolia
function initializeAlgolia() {
  console.log("Destination parameter:", destination);
  const search = instantsearch({
    indexName: INDEX,
    searchClient,
    facets: ["Name", "Type"],
    routing: instantSearchRouter,
    searchParameters: {
      filters: destination ? `Type:${destination}` : "",
    },
    insights: true,
  });

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
                  <button ${createDataAttribtues(
                    refinement
                  )} class="currenteRefinamentItemClose">
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
              <button ${createDataAttribtues(
                refinement
              )} class="currenteRefinamentItemClose">
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
         <a href="${createLink("destinations/" + hit.Slug)}">
              <div class="card-image-wrapper">
                <img class="card-image" src="${
                  hit["Main Image"]
                    ? hit["Main Image"]
                    : "https://uploads-ssl.webflow.com/6638e2cff0f7820ea919dcbe/6639335a592d50e740330397_card-bg-shape-orange.png"
                }" alt="${hit.Name}" />
              </div>
              <div class="card-header">
                <p class="card-tagline">${hit.Type}</p>
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

  search.addWidgets([
    instantsearch.widgets.searchBox({
      container: "#searchbox",
      placeholder: "Search by location or zipcode",
      searchAsYouType: false,
      showSubmit: true,
      showReset: true,
      showLoadingIndicator: true,
      cssClasses: {
        submit: "search-submit",
        reset: "search-reset",
      },
    }),
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
            console.log(item);
            setInstantSearchUiState({
              query: item.Name,
            });
          },
        },
      },
    }),
    /*  instantsearch.widgets.hits({
      container: '#hits',
      templates: {
        item: (hit, { html, components }) => {
          return `
            <a href="${createLink('destinations/'+hit.Slug)}">
              <div class="card-image-wrapper">
                <img class="card-image" src="${hit['Main Image'] ? hit['Main Image'] : "https://uploads-ssl.webflow.com/6638e2cff0f7820ea919dcbe/6639335a592d50e740330397_card-bg-shape-orange.png"}" alt="${hit.Name}" />
              </div>
              <div class="card-header">
                <p class="card-tagline">${hit.Type}</p>
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
    }), */
    instantsearch.widgets.dynamicWidgets({
      container: "#dynamic-widgets",
      fallbackWidget({ container, attribute }) {
        return instantsearch.widgets.panel({
          templates: {
            header: () => {
              return attribute;
            },
          },
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
  if (destination) {
    setInstantSearchUiState({
      query: destination,
    });
  }

  function setInstantSearchUiState(indexUiState) {
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
  const submitButton = document.querySelector(".search-submit");
  if (submitButton) {
    submitButton.innerText = "Explore";
  }
}

function loadGoogleMapsAPI() {
  const script = document.createElement("script");
  script.src =
    "https://maps.googleapis.com/maps/api/js?key=AIzaSyDlPRak0SL63kzs6RqKUAaQ4Bc6oCiLKFM&callback=initializeAlgolia";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

loadGoogleMapsAPI();
