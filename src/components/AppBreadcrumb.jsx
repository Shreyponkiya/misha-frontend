import React, { Component } from "react";
import routes from "../routes";

class AppBreadcrumb extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentLocation: window.location.pathname,
    };
  }

  componentDidMount() {
    // Listen for route changes
    this.updateLocation();
    window.addEventListener("popstate", this.updateLocation);
  }

  componentWillUnmount() {
    window.removeEventListener("popstate", this.updateLocation);
  }

  updateLocation = () => {
    this.setState({
      currentLocation: window.location.pathname,
    });
  };

  getBreadcrumbs = () => {
    const { currentLocation } = this.state;
    const crumbs = [];

    routes.forEach((route) => {
      if (route.path && currentLocation.includes(route.path)) {
        crumbs.push(route);
      }
    });

    return crumbs;
  };

  render() {
    const breadcrumbs = this.getBreadcrumbs();

    return (
      <nav className="flex ml-2" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          {/* Home Breadcrumb */}
          <li className="inline-flex items-center">
            <a
              href="/"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
            >
              <svg
                className="w-3 h-3 mr-2.5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
              </svg>
              Home
            </a>
          </li>

          {/* Dynamic Breadcrumbs */}
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li key={index}>
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 text-gray-400 mx-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  {isLast ? (
                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                      {crumb.name}
                    </span>
                  ) : (
                    <a
                      href={crumb.path}
                      className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 transition-colors duration-200"
                    >
                      {crumb.name}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
}

export default AppBreadcrumb;
