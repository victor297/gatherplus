"use client";

import React, { useState, useEffect, useCallback } from "react";
import Filter from "./components/Filter.component";
import EventCard from "./components/EventCard.component";
import SearchBar from "./components/SearchBar.component";
import { EventProps } from "../homepage/EventCard";
import {
  useLazyGetAllPublicEventsQuery,
  useLazySortEventsQuery,
} from "@/services/slices/events.slice";
import { toast } from "react-toastify";

export default function Explore() {
  const [events, setEvents] = useState<EventProps[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortQuery, setSortQuery] = useState("");

  // Track filter state to know when we should auto-fetch on page changes
  const [activeFilters, setActiveFilters] = useState(false);

  // Store last page internally to detect changes
  const [lastPage, setLastPage] = useState(currentPage);

  const [getAllPublicEvents] = useLazyGetAllPublicEventsQuery();
  const [sortEvents] = useLazySortEventsQuery();

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await getAllPublicEvents("").unwrap();
      if (
        response &&
        response.message === "SUCCESSFUL" &&
        response.body &&
        response.body.events &&
        response.body.events.result &&
        response.body.events.result.length > 0
      ) {
        setEvents(response.body.events.result);
        setTotalPages(response.body.events.totalPages);
        setCurrentPage(response.body.events.currentPage);
      }
    };
    fetchEvents();
  }, [getAllPublicEvents]);

  const updateStateAfterSearchAndFilter = (
    events: EventProps[],
    currentPage: number,
    totalPages: number,
  ) => {
    setEvents(events);
    setTotalPages(totalPages);
    setCurrentPage(currentPage);
  };

  const fetchFilteredData = useCallback(
    async ({ page, query }: { page: number; query: string }) => {
      if (page < 0) {
        return;
      }

      try {
        const response = await sortEvents({
          sort: query,
          page: page,
        }).unwrap();

        if (
          response?.message === "SUCCESSFUL" &&
          response.body?.result?.length > 0
        ) {
          updateStateAfterSearchAndFilter(
            response.body.result,
            response.body.currentPage,
            response.body.totalPages - 1,
          );
        } else if (
          response?.message === "SUCCESSFUL" &&
          response.body?.result?.length === 0
        ) {
          toast.info("No events found with the selected sort", {
            position: "top-right",
          });
          updateStateAfterSearchAndFilter([], page, 0);
        }
      } catch {
        toast.error("Error fetching filtered events", {
          position: "top-right",
        });
      }
    },
    [sortEvents],
  );

  useEffect(() => {
    if (currentPage !== lastPage && activeFilters && sortQuery !== "") {
      fetchFilteredData({
        page: currentPage,
        query: sortQuery,
      });

      setLastPage(currentPage);
    }
  }, [currentPage, lastPage, activeFilters, sortQuery, fetchFilteredData]);

  const handleSortEvents = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setSortQuery(value);
    setActiveFilters(true);

    await fetchFilteredData({
      page: currentPage,
      query: value, // Use the updated value, not the stale state
    });
  };

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div
      className="bg-[#0b1120]"
      style={{
        background: `
      linear-gradient(
        to bottom,
        rgba(3, 13, 30, 0.8) 75%,
        rgba(7, 72, 61, 0.7) 100%,
        rgba(3, 15, 31, 0.7) 100%,
        rgba(0, 0, 0, 0.9) 100%,
        rgba(0, 0, 0, 0) 10%
      ),
      repeating-linear-gradient(
        0deg,
        transparent 0,
        rgba(255, 255, 255, 0.1) 1px,
        transparent 50px
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0,
        rgba(255, 255, 255, 0.1) 1px,
        transparent 50px
      )
    `,
        backgroundSize: "100% 100%, 10px 10px, 10px 10px",
        backgroundPosition: "center",
      }}
    >
      {/* Hero section */}
      <div
        className="relative flex flex-col items-center justify-center text-white h-[500px] sm:h-[600px] lg:h-[707px]"
        style={{
          backgroundImage: `
          linear-gradient(
            to bottom,
            rgba(3, 13, 30, 0.8) 75%,
            rgba(7, 72, 61, 0.7) 100%,
            rgba(3, 15, 31, 0.7) 100%,
            rgba(0, 0, 0, 0.9) 100%,
            rgba(0, 0, 0, 0) 10%
          ),
          url('https://res.cloudinary.com/dondkf6je/image/upload/f_auto,q_auto/v1/GatherPlux%20-%20Dev%20Images/hqttomr2qy90ybsnknzn')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-8">
          <h1 className="text-[32px] sm:text-[48px] lg:text-[64px] font-normal leading-none mb-8">
            Explore a world of events and <br />
            find what excites you
          </h1>

          {/* Search Bar */}
          <SearchBar
            handleStateUpdate={updateStateAfterSearchAndFilter}
            currentPage={currentPage}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row mx-auto pt-[50px] sm:pt-[70px] lg:pt-[100px] px-4 sm:px-8 lg:px-[94px] pb-[60px] w-full space-y-8 lg:space-y-0 lg:space-x-12">
        {/* Filter Section */}
        <Filter
          handleStateUpdate={updateStateAfterSearchAndFilter}
          currentPage={currentPage}
        />

        {/* Events Section */}
        <div className="flex flex-col w-full">
          <div className="flex items-center space-x-2 mb-6 sm:mb-8 lg:mb-10 justify-end">
            <p className="text-[16px] sm:text-[18px] lg:text-[20px]">
              Sort by:
            </p>
            <select
              className="w-[200px] sm:w-[240px] lg:w-[270px] h-[40px] sm:h-[48px] lg:h-[54px] text-[16px] sm:text-[18px] lg:text-[22px] bg-white text-black border border-gray-300 rounded px-4 py-2 pr-8 appearance-none bg-no-repeat bg-right focus:outline-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%23666' d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z'/%3E%3C/svg%3E")`,
                backgroundSize: "1.5rem",
                backgroundPosition: "right 0.5rem center",
              }}
              aria-label="Sort events"
              value={sortQuery}
              onChange={handleSortEvents}
            >
              <option value="relevance">Relevance</option>
              <option value="location">Location</option>
              <option value="price">Price</option>
            </select>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {events && events.length > 0 ? (
              events.map((event) => (
                <EventCard key={event.id} eventDetails={event} />
              ))
            ) : (
              <p>No events found.</p>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 px-4 py-5">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-4 py-2 border border-gray-500 rounded text-white"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages ? totalPages : 0}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-500 rounded text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
