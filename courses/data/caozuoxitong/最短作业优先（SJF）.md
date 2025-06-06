**最短作业优先调度算法（Shortest Job First, SJF）** 是一种以作业长度为依据的调度策略，优先执行预计运行时间最短的进程。

**特点：**
- **可以是抢占式或非抢占式**：
  - **非抢占式（SJF）**：一旦开始执行，就运行到结束。
  - **抢占式（SRTF，最短剩余时间优先）**：如果新进程比当前运行进程更短，将中断当前进程。

**优点：**
- 在所有调度算法中，**平均等待时间最小**，调度效率高。

**缺点：**
- 需要预先知道每个进程的执行时间，这在实际系统中难以准确预测。
- 可能造成长作业“饥饿”，即长时间得不到执行。

SJF 常用于批处理系统中的作业调度。