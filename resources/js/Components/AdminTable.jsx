import React from 'react'

export default function AdminTable({
  columns,
  rows,
  getRowKey,
  page,
  pageSize,
  onPageChange,
  sortKey,
  sortDirection,
  onSortChange,
  emptyMessage = 'No records found.',
}) {
  const totalRows = rows ? rows.length : 0
  const safePageSize = pageSize || 10
  const totalPages = Math.max(1, Math.ceil(totalRows / safePageSize))
  const currentPage = Math.min(Math.max(page || 1, 1), totalPages)
  const startIndex = (currentPage - 1) * safePageSize
  const endIndex = startIndex + safePageSize
  const visibleRows = rows.slice(startIndex, endIndex)

  const getPageNumbers = () => {
    const maxButtons = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  function handleSort(id) {
    if (!onSortChange) return
    onSortChange(id)
  }

  function goToPage(next) {
    if (!onPageChange) return
    if (next < 1 || next > totalPages) return
    onPageChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-visible border border-gray-100 rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b border-gray-100">
              {columns.map(col => {
                const isSortable = col.sortable
                const isActive = isSortable && sortKey === col.id
                const ariaSort = isSortable ? (isActive ? (sortDirection === 'desc' ? 'descending' : 'ascending') : 'none') : undefined
                return (
                  <th
                    key={col.id}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`px-3 py-3 text-left align-middle ${col.headerClassName || 'text-xs font-medium text-gray-500 uppercase tracking-wide'}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.id)}
                        className="inline-flex items-center gap-1 text-gray-600 hover:text-emerald-700"
                      >
                        <span>{col.header}</span>
                        <span className="flex flex-col leading-none">
                          <span className={`h-1 w-2 rounded-sm ${isActive && sortDirection === 'asc' ? 'bg-emerald-600' : 'bg-gray-300'}`}></span>
                          <span className={`h-1 w-2 rounded-sm mt-0.5 ${isActive && sortDirection === 'desc' ? 'bg-emerald-600' : 'bg-gray-300'}`}></span>
                        </span>
                      </button>
                    ) : (
                      <span className="text-gray-600">{col.header}</span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody key={currentPage} className="animate-table-fade">
            {visibleRows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-sm text-gray-500"
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {visibleRows.map(row => (
              <tr
                key={getRowKey(row)}
                className="group border-b border-gray-100 last:border-b-0 transition-colors duration-150 hover:bg-emerald-50"
              >
                {columns.map(col => (
                  <td
                    key={col.id}
                    className={`px-3 py-3 whitespace-nowrap align-middle ${col.cellClassName || 'text-gray-700'}`}
                  >
                    {col.render ? col.render(row) : col.accessor ? col.accessor(row) : row[col.id]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">
          Showing{' '}
          {totalRows === 0 ? 0 : startIndex + 1}
          {' '}
          to{' '}
          {Math.min(endIndex, totalRows)}
          {' '}
          of{' '}
          {totalRows}
          {' '}
          entries
        </div>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-500 hover:text-emerald-700 transition-colors"
          >
            Prev
          </button>
          {getPageNumbers().map(num => (
            <button
              key={num}
              type="button"
              onClick={() => goToPage(num)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                num === currentPage
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-emerald-500 hover:text-emerald-700'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-500 hover:text-emerald-700 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

