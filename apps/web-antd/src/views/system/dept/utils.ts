import type { SystemDeptApi } from '#/api/system/dept';

export interface DeptTreeOption {
  children?: DeptTreeOption[];
  disabled?: boolean;
  label: string;
  value: string;
}

export function flattenDeptTree(items: SystemDeptApi.SystemDept[] = []) {
  const map = new Map<string, SystemDeptApi.SystemDept>();

  const walk = (nodes: SystemDeptApi.SystemDept[]) => {
    nodes.forEach((node) => {
      map.set(node.id, node);
      if (node.children?.length) {
        walk(node.children);
      }
    });
  };

  walk(items);
  return map;
}

export function getDeptName(
  deptId: string | undefined,
  deptMap: Map<string, SystemDeptApi.SystemDept>,
) {
  if (!deptId) {
    return '-';
  }
  return deptMap.get(deptId)?.name ?? '未知部门';
}

export function toDeptTreeOptions(
  items: SystemDeptApi.SystemDept[] = [],
): DeptTreeOption[] {
  return items.map((item) => ({
    children: item.children?.length
      ? toDeptTreeOptions(item.children)
      : undefined,
    disabled: item.status !== 1,
    label: item.name,
    value: item.id,
  }));
}
