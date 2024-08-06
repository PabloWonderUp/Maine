document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".destination-link").forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const destinationAttribute = this.getAttribute("url-destination");
      window.location.href = `/destinations?destination=${destinationAttribute}`;
    });
  });
});

const { algoliasearch, instantsearch } = window;
const { geoSearch, currentRefinements } = instantsearch.widgets;
const historyRouter = instantsearch.routers.history;
const { connectAutocomplete, connectSearchBox, connectCurrentRefinements } =
  instantsearch.connectors;
const { autocomplete, getAlgoliaResults } = window["@algolia/autocomplete-js"];
const { createTagsPlugin, Tag } = window["@algolia/autocomplete-plugin-tags"];
const { render, createElement } = window["preact"];
const searchClient = algoliasearch(
  "ZQ06XZRLUH",
  "9a35106a4f4df2442ac70db0dbaa77fe"
);

const generateStars = (stars) => {
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= stars) {
      starsHtml += `<div class="rating-icon"> <svg width="100%" height="100%" class="refinement-star" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 0L9.18386 5.18237H14.6329L10.2245 8.38525L11.9084 13.5676L7.5 10.3647L3.09161 13.5676L4.77547 8.38525L0.367076 5.18237H5.81614L7.5 0Z" fill="currentColor"/>
  </svg></div>`;
    } else {
      starsHtml += `<div class="rating-icon w-embed" style="opacity: 0.2;"> <svg width="100%" height="100%" class="refinement-star" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 0L9.18386 5.18237H14.6329L10.2245 8.38525L11.9084 13.5676L7.5 10.3647L3.09161 13.5676L4.77547 8.38525L0.367076 5.18237H5.81614L7.5 0Z" fill="currentColor"/>
  </svg></div>`;
    }
  }
  return starsHtml;
};

const generatePriceRange = (priceRange) => {
  let priceHtml = "";
  for (let i = 1; i <= 3; i++) {
    if (i <= priceRange) {
      priceHtml += '<span class="price_text">$</span>';
    } else {
      priceHtml += '<span class="price_text price_text-inactive">$</span>';
    }
  }
  return priceHtml;
};
// Function to get the base URL
const getBaseURL = () => {
  const { protocol, hostname, port } = window.location;
  return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
};
const baseURL = getBaseURL();

const createLink = (path) => {
  return `${baseURL}/${path}`;
};

const globalSearchTarget = document.getElementById("global-search-target");
if (globalSearchTarget) {
  // Algolia Config
  const globalSearch = instantsearch({
    indexName: "destinations",
    searchClient,
    insights: true,
    searchFunction(helper) {
      helper.search();

      const noResultsContainer = document.querySelector("#no-results");
      if (noResultsContainer) {
        noResultsContainer.style.display = "none";
      }
    },
  });

  globalSearch.on("render", () => {
    const containers = [
      "#hits-guides",
      "#hits-destinations",
      "#hits-restaurants",
      "#hits-hotels",
    ];
    const noResultsContainer = document.querySelector("#no-results");
    let totalHits = 0;
    let allHits = [];

    containers.forEach((selector) => {
      const container = document.querySelector(selector);
      const hits = container.querySelectorAll(".hit");
      hits.forEach((hit) => {
        if (hit.textContent.trim()) {
          // Check if hit is not empty
          allHits.push(hit);
        }
      });
      totalHits += hits.length;

      // Remove all children from container
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    });
    if (noResultsContainer) {
      if (totalHits > 0) {
        noResultsContainer.style.display = "none";
      } else {
        noResultsContainer.style.display = "block";
      }
    }

    // Create a new grid container and append hits to it
    const gridContainer = document.createElement("div");
    gridContainer.classList.add("grid-container");

    allHits.forEach((hit) => {
      gridContainer.appendChild(hit);
    });

    // Remove old grid container if it exists and add the new one
    const hitsWrapper = document.getElementById("hits-wrapper");
    const oldGridContainer = hitsWrapper.querySelector(".grid-container");
    if (oldGridContainer) {
      hitsWrapper.removeChild(oldGridContainer);
    }
    hitsWrapper.appendChild(gridContainer);
    // Update the results count
    const resultsCountElement = document.getElementById("results-count");
    const searchBoxElement = document.querySelector("#searchbox input");
    const searchQuery = searchBoxElement.value;
    if (searchQuery) {
      resultsCountElement.textContent = `${totalHits} results found for "${searchQuery}"`;
      resultsCountElement.style.display = "block";
    } else {
      resultsCountElement.style.display = "none";
    }
  });

  globalSearch.addWidgets([
    instantsearch.widgets.configure({
      hitsPerPage: 2000,
    }),
    instantsearch.widgets.searchBox({
      container: "#searchbox",
      placeholder: "Find a Location, Restaurant, Hotel, or Activity",
      showSubmit: true,
      showLoadingIndicator: true,
      autofocus: false,
    }),
    instantsearch.widgets
      .index({
        indexName: "destinations",
      })
      .addWidgets([
        instantsearch.widgets.hits({
          container: "#hits-destinations",
          templates: {
            item: (hit, { html, components }) => {
              return `        
                    <a class="hit card3_item"  href="${createLink(
                      "destinations/" + hit.Slug
                    )}">
                        <div class="card3_image-wrapper">
                            <img src="${
                              hit["Main Image"]
                                ? hit["Main Image"]
                                : "https://uploads-ssl.webflow.com/6638e2cff0f7820ea919dcbe/6639335a592d50e740330397_card-bg-shape-orange.png"
                            }" alt="${
                hit.Name
              }" class="hit_bg-image card3_image">
  </div>
                        <div class="card3_item-content">
                            <div class="card3_item-content-top">
                                <div class="card3_category-wrapper">
                                    <div class="filters_tagline">${
                                      hit.Type
                                    }</div>
  </div>
                                <div class="card3_title-wrapper">
                                    <h3 class="destination_title">${
                                      hit.Name
                                    }</h3>
  </div>
                                <div class="text-size-regular">${
                                  hit.Description
                                }</div>
  </div>
                            <div class="card3_reviews-wrapper">
                                <div class="text-size-small">${hit.Stars}</div>
                                <div class="card-rating">
                                ${generateStars(hit.Stars)}
  </div>
                                <div class="card-reviews">
                                (21)                
  </div>  
  </div>
  </div>
  </a>
            `;
            },
          },
        }),
      ]),
    instantsearch.widgets
      .index({
        indexName: "restaurants",
      })
      .addWidgets([
        instantsearch.widgets.hits({
          container: "#hits-restaurants",
          templates: {
            item: (hit, { html, components }) => {
              return `
                    <a class="hit card3_item"  href="${createLink(
                      "restaurants/" + hit.Slug
                    )}">
                    <div class="card3_image-wrapper">  
                        <img src="${
                          hit["Main Image"]
                            ? hit["Main Image"]
                            : "https://uploads-ssl.webflow.com/6638e2cff0f7820ea919dcbe/6639335a592d50e740330397_card-bg-shape-orange.png"
                        }" alt="${hit.Name}" class="hit_bg-image card3_image">
  </div>
                    <div class="card3_item-content">
                        <div class="card3_item-content-top">
                            <div blocks-name="blog3_category-wrapper" class="card3_category-wrapper is-hotel">
                                <div class="price_wrapper">${generatePriceRange(
                                  hit["Price range"]
                                )}</div>
                                <div class="card3_divider">|</div>
                                <div class="filters_tagline">RESTAURANT</div>
                                <div class="card3_divider">|</div>
                                <div class="filters_tagline">${
                                  hit["Destination Name"]
                                }</div>
  </div>
                            <div blocks-name="blog3_title-wrapper" class="card3_title-wrapper">
                                <h3 class="destination_title">${hit.Name}</h3>
  </div>
                            <div blocks-name="block-2" class="text-size-regular text-style-3lines">NULL</div>
  </div>
                        <div blocks-name="grid-list9_reviews-wrapper" class="card3_reviews-wrapper">
                            <div class="card3_reviews-wrapper">
                                <div class="text-size-small">${hit.Stars}</div>
                                <div class="card-rating">
                                ${generateStars(hit.Stars)}
  </div>
                                <div class="card-reviews">
                                (21)                
  </div>  
  </div>
  </div>
  </div>
  </a>

            `;
            },
          },
        }),
      ]),
    instantsearch.widgets
      .index({
        indexName: "hotels",
      })
      .addWidgets([
        instantsearch.widgets.hits({
          container: "#hits-hotels",
          templates: {
            item: (hit, { html, components }) => {
              return `
                    <a class="hit card3_item" href="${createLink(
                      "hotels/" + hit.Slug
                    )}">
                    <div class="card3_image-wrapper">  
                        <img src="${
                          hit["Main Image"]
                            ? hit["Main Image"]
                            : "https://uploads-ssl.webflow.com/6638e2cff0f7820ea919dcbe/6639335a592d50e740330397_card-bg-shape-orange.png"
                        }" alt="${hit.Name}" class="hit_bg-image card3_image">
  </div>
                    <div class="card3_item-content">
                        <div class="card3_item-content-top">
                            <div blocks-name="blog3_category-wrapper" class="card3_category-wrapper is-hotel">
                                <div class="price_text">$$$</div>
                                <div class="card3_divider">|</div>
                                <div class="filters_tagline">HOTEL</div>
                                <div class="card3_divider">|</div>
                                <div class="filters_tagline">${
                                  hit["Destination Name"]
                                }</div>
  </div>
                            <div blocks-name="blog3_title-wrapper" class="card3_title-wrapper">
                                <h3 class="destination_title">${hit.Name}</h3>
  </div>
                            <div blocks-name="block-2" class="text-size-regular text-style-3lines">NULL</div>
  </div>
                        <div blocks-name="grid-list9_reviews-wrapper" class="card3_reviews-wrapper">
                            <div class="card3_reviews-wrapper">
                                <div class="text-size-small">${hit.Stars}</div>
                                <div class="card-rating">
                                ${generateStars(hit.Stars)}
  </div>
                                <div class="card-reviews">
                                (21)                
  </div>  
  </div>
  </div>
  </div>
  </a>
                `;
            },
          },
        }),
      ]),
    /*instantsearch.widgets.index({
        indexName: 'Guides',
    }).addWidgets([
        instantsearch.widgets.hits({
        container: '#hits-guides', 
        templates: {
            item: (hit, { html, components }) => {
            return `        
                    <a class="hit slider_5card-item" href="${createLink('guides/'+hit.Slug)}">
                        <div class="guides_5cards-link w-inline-block">
                        <div class="slider_card-image-wrapper">
                            <img src="${hit['Main Image'] ? hit['Main Image'] : "https://uploads-ssl.webflow.com/6638e2cff0f7820ea919dcbe/6639335a592d50e740330397_card-bg-shape-orange.png"}" alt="${hit.Name}" class="card_image">
                            <div class="slider_card-image-overlay"></div>
  </div>
                        <div class="guide-featured_card-content">
                            <div class="slider_card-top">
                                <div class="slider_card-icon w-embed"><svg width="100%" height="100%" viewBox="0 0 53 30" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M52.7556 22.6442C52.6796 22.0941 52.1655 21.695 51.6074 21.7578L39.8313 23.086C38.8875 23.1923 38.7565 22.709 39.6263 22.3345L50.4993 17.6532C51.016 17.431 51.261 16.8401 51.0481 16.3237C50.1279 14.091 48.9044 12.0118 47.4301 10.1361C47.0823 9.69418 46.4438 9.60412 45.9886 9.93715L36.4531 16.914C35.6887 17.4731 35.3337 17.1232 35.8996 16.3671L42.9528 6.93339C43.2895 6.48309 43.1985 5.85137 42.7518 5.50732C40.8557 4.04885 38.7539 2.83854 36.4969 1.92821C35.9749 1.71764 35.3783 1.95931 35.153 2.47117L30.4183 13.2377C30.0391 14.1 29.5557 13.9724 29.6631 13.0381L31.0038 1.37489C31.0673 0.823507 30.6639 0.314241 30.1078 0.239083C28.9171 0.0796942 27.7061 0 26.4997 0C25.2926 0 24.0822 0.0796942 22.8909 0.240378C22.3348 0.315537 21.9313 0.824154 21.9949 1.37618L23.3356 13.0394C23.443 13.9737 22.9596 14.1013 22.5804 13.239L17.8457 2.47246C17.6211 1.96125 17.0238 1.71893 16.5018 1.92951C14.2448 2.83983 12.143 4.05015 10.2469 5.50862C9.80024 5.85266 9.7092 6.48439 10.0458 6.93469L17.0991 16.3684C17.6643 17.1245 17.31 17.4744 16.5456 16.9153L7.01012 9.93845C6.55493 9.60542 5.91635 9.69548 5.56856 10.1374C4.0936 12.0131 2.8708 14.0923 1.95058 16.325C1.73772 16.8414 1.98202 17.4316 2.49944 17.6545L13.3724 22.3358C14.2422 22.7103 14.1112 23.1936 13.1674 23.0873L1.39125 21.7591C0.833227 21.6963 0.319086 22.0954 0.243111 22.6455C-0.0509648 24.7817 -0.0771631 26.971 0.158621 29.0923C0.216258 29.6106 0.664248 30 1.19083 30H51.8092C52.3358 30 52.7837 29.6106 52.8414 29.0923C53.0772 26.971 53.051 24.7817 52.7569 22.6455L52.7556 22.6442Z"
                                            fill="currentColor"></path>
  </svg></div>
                                <div class="spacer-16"></div>
                                <div class="guides_tagline">Travel Guides</div>
                                <div class="spacer-8"></div>
                                <div class="slider_card-title-wrapper">
                                    <h3 class="guides_title text-style-3lines">${hit.Name}</h3>
  </div>
  </div>
                            <div class="slider_card-item-bottom">
                                <div class="slider_card-category-wrapper">
                                    <div class="guide-grid_category-icon w-embed"><svg width="100%" height="100%" viewBox="0 0 12 7"
                                            fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" clip-rule="evenodd"
                                                d="M8.57171 0.0715332H0.857422V6.92868H8.57171L11.1431 3.5001L8.57171 0.0715332ZM6.85723 4.78569C7.56731 4.78569 8.14294 4.21006 8.14294 3.49998C8.14294 2.7899 7.56731 2.21426 6.85723 2.21426C6.14715 2.21426 5.57151 2.7899 5.57151 3.49998C5.57151 4.21006 6.14715 4.78569 6.85723 4.78569Z"
                                                fill="currentColor"></path>
  </svg></div>
                                    <div class="text-size-tiny text-weight-bold">${hit["Guides Tag"]}</div>
  </div>
  </div>
  </div>
  </div>
  </a>
            `;
            },
        },
        }),
    ]),*/
  ]);

  globalSearch.start();

  // Function to set the display of result containers to none
  const setDisplayNoneForHitsContainers = () => {
    const hitsContainers = document.querySelectorAll(".grid-container");
    hitsContainers.forEach((container) => {
      container.style.display = "none";
    });
  };

  // Ensure that the containers are hidden when the page loads
  setDisplayNoneForHitsContainers();

  // Event listeners to show/hide the result containers
  const searchBox = document.querySelector("#searchbox input");
  const hitsWrapper = document.querySelector("#hits-wrapper");

  const showHitsContainers = () => {
    const hitsContainers = document.querySelectorAll(".grid-container");
    hitsContainers.forEach((container) => {
      container.style.display = "flex";
    });
    hitsWrapper.style.display = "flex";
  };

  const hideHitsContainers = () => {
    setTimeout(() => {
      setDisplayNoneForHitsContainers();
      hitsWrapper.style.display = "none";
    }, 200);
  };

  // Show the hits containers when the search box is focused or when input is detected
  hideHitsContainers();
  searchBox.addEventListener("focus", () => {
    showHitsContainers();
    // Trigger a search to ensure results are displayed
    searchBox.dispatchEvent(new Event("input"));
  });

  searchBox.addEventListener("input", () => {
    showHitsContainers();
  });

  // Hide the hits containers when the search box loses focus
  searchBox.addEventListener("blur", () => {
    hideHitsContainers();
  });

  // Function to show the target element on mobile when the global-search element is clicked
  const toggleElementDisplayOnClick = (triggerId, targetId, closeId) => {
    const triggerElement = document.getElementById(triggerId);
    const targetElement = document.getElementById(targetId);
    const closeElement = document.getElementById(closeId);

    if (!triggerElement || !targetElement || !closeElement) {
      console.error("Trigger, target, or close element not found.");
      return;
    }

    const isMobile = () => window.innerWidth <= 480;

    triggerElement.addEventListener("click", () => {
      if (isMobile()) {
        targetElement.style.display = "block";
      }
    });

    closeElement.addEventListener("click", () => {
      if (isMobile()) {
        targetElement.style.display = "none";
      }
    });
  };

  toggleElementDisplayOnClick(
    "global-search",
    "global-search-target",
    "global-search-close"
  );
}
