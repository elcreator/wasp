import { useState, useMemo } from "react";
import getStats from "@wasp/queries/getStats";
import { useQuery } from "@wasp/queries";
import { Link } from "react-router-dom";
import { Color, availableColors } from "../components/Color";
import { format } from "timeago.js";
import { StatusPill } from "../components/StatusPill";
import { BarChart } from "../components/BarChart";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { exampleIdeas } from "../examples";
import logout from "@wasp/auth/logout";
import { WaspIcon } from "../components/WaspIcon";
import { Header } from "../components/Header";
import { PiDownloadDuotone } from "react-icons/pi";
import { MyDropdown } from "../components/Dropdown";

const chartTypes = [
  {
    name: "Last 24 hours",
    value: "last24Hours",
  },
  {
    name: "Last 30 days",
    value: "last30Days",
  },
];

export function Stats() {
  const [filterOutExampleApps, setFilterOutExampleApps] = useState(false);
  const [filterOutKnownUsers, setFilterOutKnownUsers] = useState(false);
  const [chartType, setChartType] = useState(chartTypes[0]);

  const { data: stats, isLoading, error } = useQuery(getStats);

  const logsByProjectId = useMemo(() => {
    if (!stats) {
      return {};
    }
    if (!stats.latestProjectsWithLogs) {
      return {};
    }
    return stats.latestProjectsWithLogs.reduce((acc, project) => {
      acc[project.id] = project.logs;
      return acc;
    }, {});
  }, [stats]);

  function getColorValue(colorName) {
    return availableColors.find((color) => color.name === colorName).color;
  }

  function getStatusName(status) {
    switch (status) {
      case "in-progress":
        return "inProgress";
      case "success":
        return "success";
      case "failure":
        return "error";
      case "cancelled":
        return "cancelled";
      default:
        return "idle";
    }
  }

  function getStatusText(status) {
    switch (status) {
      case "in-progress":
        return "In progress";
      case "success":
        return "Success";
      case "failure":
        return "Error";
      case "cancelled":
        return "Cancelled";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  }

  const filteredStats = useMemo(() => {
    const filters = [];
    if (filterOutExampleApps) {
      filters.push(
        (stat) =>
          !exampleIdeas.some(
            (example) =>
              example.name === stat.name &&
              example.description === stat.description
          )
      );
    }
    if (filterOutKnownUsers) {
      filters.push((stat) => !stat.user);
    }
    return stats
      ? stats.projects.filter((stat) => {
          return filters.every((filter) => filter(stat));
        })
      : [];
  }, [stats, stats?.projects, filterOutExampleApps, filterOutKnownUsers]);

  if (isLoading) {
    return <p>Loading</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  if (!stats) {
    return <p>Couldn't load stats</p>;
  }

  const downloadedPercentage =
    Math.round(stats.downloadStats.downloadRatio * 10000) / 100;

  function getFormattedDiff(start, end) {
    const diff = (end - start) / 1000;
    const minutes = Math.round(diff / 60);
    const remainingSeconds = Math.round(diff % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  function getDuration(stat) {
    if (!logsByProjectId[stat.id]) {
      return "-";
    }
    const logs = logsByProjectId[stat.id];
    if (logs.length < 2) {
      return "-";
    }
    const start = logs[logs.length - 1].createdAt;
    const end = logs[0].createdAt;
    return getFormattedDiff(start, end);
  }

  function getWaitingInQueueDuration(stat) {
    if (!logsByProjectId[stat.id]) {
      return "-";
    }
    const logs = logsByProjectId[stat.id];
    if (logs.length < 2) {
      return "-";
    }
    const start = stat.createdAt;
    const end = logs[logs.length - 1].createdAt;
    return getFormattedDiff(start, end);
  }
  return (
    <>
      <Header />
      <div className="big-box">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-semibold text-slate-800">Stats</h1>
          <div>
            <button className="button sm" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {stats.projects.length === 0 && (
          <p className="text-sm text-slate-500">No projects created yet.</p>
        )}

        {stats.projects.length > 0 && (
          <>
            <div className="mb-3 flex justify-between items-end">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Projects over time
                </h2>
              </div>
              <div className="w-1/3">
                <MyDropdown
                  options={chartTypes}
                  value={chartType}
                  onChange={setChartType}
                />
              </div>
            </div>
            <div style={{ height: 300, width: "100%" }} className="mb-4">
              <ParentSize>
                {({ width, height }) => (
                  <BarChart
                    chartType={chartType.value}
                    projects={filteredStats}
                    width={width}
                    height={height}
                  />
                )}
              </ParentSize>
            </div>

            <div className="py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <div className="flex items-center mb-4">
                  <input
                    id="filter"
                    type="checkbox"
                    checked={filterOutExampleApps}
                    onChange={(event) =>
                      setFilterOutExampleApps(event.target.checked)
                    }
                    className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                  />
                  <label
                    htmlFor="filter"
                    className="ml-2 text-sm font-medium text-gray-900"
                  >
                    Filter out example apps
                  </label>
                </div>
                <div className="flex items-center mb-4">
                  <input
                    id="default-checkbox"
                    type="checkbox"
                    checked={filterOutKnownUsers}
                    onChange={(event) =>
                      setFilterOutKnownUsers(event.target.checked)
                    }
                    className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                  />
                  <label
                    htmlFor="default-checkbox"
                    className="ml-2 text-sm font-medium text-gray-900"
                  >
                    Filter out known users
                  </label>
                </div>
              </div>

              <p className="text-sm text-slate-800 flex gap-2">
                <span className="bg-slate-100 rounded-md px-2 py-1">
                  Generated:{" "}
                  <strong className="text-slate-800">
                    {filteredStats.length}
                  </strong>
                </span>
                <span className="bg-slate-100 rounded-md px-2 py-1">
                  Downlaoded:{" "}
                  <strong className="text-slate-800">{`${stats.downloadStats.projectsDownloaded} (${downloadedPercentage}%)`}</strong>
                </span>
              </p>
            </div>

            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      App Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Created At
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Time in Queue &rarr; Build
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Creativity lvl
                    </th>
                    <th scope="col" className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.map((stat) => (
                    <tr className="bg-white border-b" key={stat.id}>
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-2"
                      >
                        <Color value={getColorValue(stat.primaryColor)} />{" "}
                        <span title={stat.description}>{stat.name}</span>{" "}
                        <span className="flex gap-1">
                          {stat.user && (
                            <span title={stat.user.email}>
                              <WaspIcon className="w-5 h-5" />
                            </span>
                          )}
                          {stat.zipDownloadedAt && (
                            <span
                              title={`Downlaoded ${format(
                                stat.zipDownloadedAt
                              )}`}
                              className="w-5 h-5 bg-sky-100 rounded-full flex items-center justify-center text-sky-800 border border-sky-200"
                            >
                              <PiDownloadDuotone className="w-3 h-3" />
                            </span>
                          )}
                        </span>
                      </th>
                      <td className="px-6 py-4">
                        <StatusPill status={getStatusName(stat.status)} sm>
                          {getStatusText(stat.status)}
                        </StatusPill>
                      </td>
                      <td
                        className="px-6 py-4"
                        title={`${stat.createdAt.toLocaleDateString()} ${stat.createdAt.toLocaleTimeString()}`}
                      >
                        {format(stat.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {getWaitingInQueueDuration(stat)} &rarr;{" "}
                        {getDuration(stat)}
                      </td>
                      <td
                        className={`px-6 py-4 creativity-${stat.creativityLevel}`}
                      >
                        {stat.creativityLevel}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/result/${stat.id}`}
                          className="font-medium text-sky-600 hover:underline"
                        >
                          View the app &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
