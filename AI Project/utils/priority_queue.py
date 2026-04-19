import heapq
from typing import Any, Tuple, List, Optional


class PriorityQueue:
    def __init__(self):
        self._heap: List[Tuple[float, Any]] = []
        self._entry_finder: dict = {}
        self._counter = 0

    def push(self, item: Any, priority: float):
        if item in self._entry_finder:
            old_priority = self._entry_finder[item][0]
            if priority >= old_priority:
                return
            del self._entry_finder[item]

        entry = (priority, self._counter, item)
        self._entry_finder[item] = entry
        self._counter += 1
        heapq.heappush(self._heap, entry)

    def pop(self) -> Any:
        while self._heap:
            priority, counter, item = heapq.heappop(self._heap)
            if item in self._entry_finder:
                del self._entry_finder[item]
                return item
        return None

    def peek(self) -> Optional[Any]:
        while self._heap:
            priority, counter, item = self._heap[0]
            if item in self._entry_finder:
                return item
            heapq.heappop(self._heap)
        return None

    def is_empty(self) -> bool:
        return len(self._heap) == 0

    def __len__(self) -> int:
        return len(self._heap)

    def get_priority(self, item: Any) -> Optional[float]:
        if item in self._entry_finder:
            return self._entry_finder[item][0]
        return None

    def contains(self, item: Any) -> bool:
        return item in self._entry_finder

    def clear(self):
        self._heap.clear()
        self._entry_finder.clear()
        self._counter = 0


class MinPriorityQueue:
    def __init__(self):
        self._heap: List[Tuple[float, Any]] = []

    def push(self, item: Any, priority: float):
        heapq.heappush(self._heap, (priority, item))

    def pop(self) -> Any:
        if self._heap:
            priority, item = heapq.heappop(self._heap)
            return item
        return None

    def peek(self) -> Optional[Any]:
        if self._heap:
            return self._heap[0][1]
        return None

    def is_empty(self) -> bool:
        return len(self._heap) == 0

    def __len__(self) -> int:
        return len(self._heap)
