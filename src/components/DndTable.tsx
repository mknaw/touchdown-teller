import React, { useMemo, useState } from 'react';

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  Modifier,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import _ from 'lodash';

export interface TableRow {
  id: string | number;
  [key: string]: any;
}

interface ColumnConfig<T extends TableRow> {
  key: string;
  label: string;
  sortable?: boolean | 'asc' | 'desc';
  renderHeader?: (column: ColumnConfig<T>) => React.ReactNode;
  renderCell?: (row: T) => React.ReactNode;
}

export interface StyleOptions<T extends TableRow> {
  table?: string;
  tbody?: string;
  header?: string;
  headerCell?: string;
  row?: string | ((row: T) => string);
  cell?: string | ((row: T, columnKey: string) => string);
  sortIcon?: string;
}

const defaultStyles: StyleOptions<TableRow> = {
  table: 'min-w-full divide-y divide-gray-200',
  tbody: '',
  header: '',
  headerCell:
    'px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider cursor-pointer',
  row: 'hover:bg-gray-800 hover:z-100 border-l-4 border-green-500',
  cell: 'px-6 py-4 whitespace-nowrap text-sm',
  sortIcon: 'ml-1',
};

// TODO prevent the double click thing

const SortableRow = <T extends TableRow>({
  row,
  columns,
  styles,
  isDragDisabled,
}: {
  row: T;
  columns: ColumnConfig<T>[];
  styles: StyleOptions<T>;
  isDragDisabled: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: row.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const rowClassName =
    typeof styles.row === 'function' ? styles.row(row) : styles.row;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isDragDisabled ? {} : listeners)}
      className={rowClassName}
    >
      {columns.map((column) => {
        const cellClassName =
          typeof styles.cell === 'function'
            ? styles.cell(row, column.key)
            : styles.cell;
        return (
          <td key={column.key} className={cellClassName}>
            {column.renderCell ? column.renderCell(row) : row[column.key]}
          </td>
        );
      })}
    </tr>
  );
};

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const DndTable = <T extends TableRow>({
  data,
  columns,
  onRowsChange,
  styleOptions = {},
  defaultSortConfig,
  isDragAllowed = () => true,
}: {
  data: T[];
  columns: ColumnConfig<T>[];
  onRowsChange: (items: T[]) => Promise<T[]>;
  styleOptions?: StyleOptions<T>;
  defaultSortConfig?: SortConfig;
  isDragAllowed?: (sortConfig: SortConfig | undefined) => boolean;
}) => {
  const modifiers: Modifier[] = [
    restrictToParentElement,
    restrictToVerticalAxis,
  ];

  const [items, setItems] = useState(data);
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(
    defaultSortConfig
  );

  const styles = { ...defaultStyles, ...styleOptions };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isDragDisabled = !isDragAllowed(sortConfig);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      try {
        // Call the async onRowsChange and wait for it to complete
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newItems = await onRowsChange(
          arrayMove(items, oldIndex, newIndex)
        );

        setItems(newItems);
      } catch (error) {
        // Handle any errors that occur during onRowsChange
        console.error('Error updating rows:', error);
        // Optionally, you could add some user feedback here
      }
    }
  };

  const handleSort = (key: string, sortable: boolean | 'asc' | 'desc') => {
    setSortConfig((prevSortConfig) => {
      if (sortable === true) {
        if (prevSortConfig && prevSortConfig.key === key) {
          return {
            key,
            direction: prevSortConfig.direction === 'asc' ? 'desc' : 'asc',
          };
        }
        return { key, direction: 'asc' };
      } else if (sortable === 'asc' || sortable === 'desc') {
        return { key, direction: sortable };
      }
      return prevSortConfig;
    });
  };

  const sortedItems = useMemo(() => {
    return items;
    // if (!sortConfig) return items;
    // return [...items].sort((a, b) => {
    //   if (a[sortConfig.key] < b[sortConfig.key]) {
    //     return sortConfig.direction === 'asc' ? -1 : 1;
    //   }
    //   if (a[sortConfig.key] > b[sortConfig.key]) {
    //     return sortConfig.direction === 'asc' ? 1 : -1;
    //   }
    //   return 0;
    // });
  }, [items, sortConfig]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={modifiers}
    >
      <table className={styles.table}>
        <thead className={styles.header}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() =>
                  column.sortable && handleSort(column.key, column.sortable)
                }
                className={styles.headerCell}
              >
                {column.renderHeader ? (
                  column.renderHeader(column)
                ) : (
                  <>
                    {column.label}
                    {sortConfig && sortConfig.key === column.key && (
                      <span className={styles.sortIcon}>
                        {sortConfig.direction === 'asc' ? ' ▼' : ' ▲'}
                      </span>
                    )}
                  </>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          <SortableContext
            items={sortedItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedItems.map((row) => (
              <SortableRow
                key={row.id}
                row={row}
                columns={columns}
                styles={styles}
                isDragDisabled={isDragDisabled}
              />
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
};

export default DndTable;
