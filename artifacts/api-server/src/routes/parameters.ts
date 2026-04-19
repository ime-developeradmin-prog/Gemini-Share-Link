import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

const PARAMETERS = [
  {
    id: "nvidia-drm-modeset",
    name: "nvidia-drm.modeset=1",
    category: "Graphics Subsystem",
    relevanceHybrid: 95,
    relevanceDgpu: 100,
    switches: "=1 (Enabled), =0 (Disabled)",
    recommendedValue: "nvidia-drm.modeset=1",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["nvidia", "drm", "wayland", "kde", "modeset"],
    verboseDescription: "Absolutely mandatory for modern NVIDIA Wayland compositing under KDE Plasma on Fedora 43 Rawhide. Setting this to 1 instructs the kernel to allow the NVIDIA proprietary driver to hook directly into the Direct Rendering Manager (DRM) subsystem. In a dGPU-only state, this ensures screen tearing is eliminated and display synchronization is handled natively by the NVIDIA hardware. In Hybrid mode, it acts as the necessary bridge for PRIME output synchronization — without it, KDE Plasma may fail to launch entirely on Wayland with the proprietary driver. Critical for the RTX 4060 Mobile GPU in the ASUS FX607V.",
  },
  {
    id: "intel-iommu",
    name: "intel_iommu=on iommu=pt",
    category: "Memory & Hardware Isolation",
    relevanceHybrid: 90,
    relevanceDgpu: 85,
    switches: "intel_iommu=on/off/igfx_off, iommu=pt/force",
    recommendedValue: "intel_iommu=on iommu=pt",
    positionalParams: null,
    riskLevel: "moderate",
    tags: ["iommu", "memory", "dma", "virtualization", "ddr5"],
    verboseDescription: "Crucial for optimizing your 16 GB DDR5 dual-channel memory on the ASUS FX607V architecture. 'intel_iommu=on' activates the Input-Output Memory Management Unit, a hardware feature vital for secure memory isolation and virtualization. 'iommu=pt' (passthrough) is the optimization catalyst: it prevents the kernel from unnecessarily translating DMA requests for trusted devices, reducing overhead and improving NVMe SSD throughput. Replacing the bare 'iommu' flag with this explicit pair ensures correct behavior across kernel versions 6.8+ used in Fedora 43 Rawhide.",
  },
  {
    id: "acpi-osi",
    name: "acpi_osi=Linux",
    category: "ASUS Firmware & ACPI",
    relevanceHybrid: 85,
    relevanceDgpu: 85,
    switches: "acpi_osi=Linux, acpi_osi=\"!Windows 2020\", acpi_osi=off",
    recommendedValue: "acpi_osi=Linux",
    positionalParams: null,
    riskLevel: "moderate",
    tags: ["acpi", "asus", "bios", "v340", "firmware", "hotkeys"],
    verboseDescription: "An aggressive workaround for the ASUS BIOS v340. Laptop manufacturers often hardcode ACPI tables to expect a Windows environment. By forcing 'acpi_osi=Linux', you command the kernel to present itself strictly as a Linux environment to the firmware. This can resolve issues with Fn key brightness controls, fan speed profiles, and ASUS-specific ACPI methods on the FX607V. Alternatively, '!Windows 2020' spoofs a specific Windows version to unlock Embedded Controller features. Test both on Fedora 43 Rawhide if hotkeys malfunction.",
  },
  {
    id: "nouveau-blacklist",
    name: "rd.driver.blacklist=nouveau modprobe.blacklist=nouveau",
    category: "Graphics Subsystem",
    relevanceHybrid: 80,
    relevanceDgpu: 100,
    switches: "blacklist=module_name (comma-separated list supported)",
    recommendedValue: "rd.driver.blacklist=nouveau modprobe.blacklist=nouveau",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["nouveau", "nvidia", "blacklist", "dracut", "kernel-module"],
    verboseDescription: "The absolute eradication of the open-source nouveau driver from the boot sequence. When forcing dGPU-only mode, any accidental loading of nouveau by the initial ramdisk (dracut) will cause a catastrophic race condition with the proprietary NVIDIA drivers, resulting in kernel panics or a black screen on Fedora 43 Rawhide. 'rd.driver.blacklist' prevents loading during dracut/initrd phase; 'modprobe.blacklist' prevents loading post-init. Both are required for complete blacklisting. Safe to apply in Hybrid mode as well — the NVIDIA proprietary stack provides full replacement.",
  },
  {
    id: "rhgb-quiet-remove",
    name: "rhgb quiet (REMOVE for debugging)",
    category: "Diagnostics & Verbosity",
    relevanceHybrid: 70,
    relevanceDgpu: 75,
    switches: "N/A — remove these flags entirely for verbose output",
    recommendedValue: "Remove both flags during debugging",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["rhgb", "quiet", "debug", "verbose", "plymouth"],
    verboseDescription: "While standard on Fedora, removing 'rhgb' (Red Hat Graphical Boot) and 'quiet' is strongly advised for Fedora 43 Rawhide development releases. These flags mask critical kernel initialization logs. Removing them exposes raw standard output as the kernel probes your Intel/NVIDIA hybrid architecture and initializes your 16GB DDR5. If the ASUS v340 BIOS causes a hang during PCIe enumeration of the RTX 4060 Mobile, seeing the raw diagnostic stream is the only way to identify the hanging subsystem. Re-add after debugging is complete for normal use.",
  },
  {
    id: "pcie-aspm",
    name: "pcie_aspm=off",
    category: "Power & PCIe Bus",
    relevanceHybrid: 30,
    relevanceDgpu: 95,
    switches: "=off, =force, =default",
    recommendedValue: "pcie_aspm=off (dGPU only), omit in Hybrid",
    positionalParams: null,
    riskLevel: "moderate",
    tags: ["pcie", "aspm", "power", "dgpu", "performance"],
    verboseDescription: "Active State Power Management controls power consumption on PCI Express links. In Hybrid mode, ASPM is vital to allow the NVIDIA GPU to reach RTD3 (Runtime D3) sleep state, saving battery. In strict dGPU mode for maximum performance, 'pcie_aspm=off' disables these power-saving states, forcing the PCIe lanes to remain fully saturated. This can resolve timing instabilities with the RTX 4060 Mobile on BIOS v340 when ASPM negotiation fails silently. Use only when maximizing GPU performance and plugged into AC power.",
  },
  {
    id: "i915-guc",
    name: "i915.enable_guc=3",
    category: "Graphics Subsystem",
    relevanceHybrid: 100,
    relevanceDgpu: 10,
    switches: "=0 (Off), =1 (Default), =2 (HuC only), =3 (GuC+HuC)",
    recommendedValue: "i915.enable_guc=3",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["i915", "intel", "guc", "huc", "hybrid", "igpu"],
    verboseDescription: "A highly specialized Intel Graphics (i915) parameter critical for Hybrid mode. Setting to 3 enables both the GuC (Graphics microController) for advanced workload scheduling and the HuC (HEVC microController) for hardware-accelerated video decoding. This significantly offloads processing from the CPU to the Intel Iris Xe iGPU, preserving your 16GB DDR5 bandwidth for the RTX 4060 Mobile when PRIME offloading is triggered. On Fedora 43 Rawhide with kernel 6.8+, GuC submission is the preferred rendering path for Intel GPUs. Irrelevant in pure dGPU mode where the iGPU is disabled.",
  },
  {
    id: "zswap",
    name: "zswap.enabled=1 zswap.max_pool_percent=15",
    category: "Memory & Hardware Isolation",
    relevanceHybrid: 75,
    relevanceDgpu: 75,
    switches: "enabled=0/1, max_pool_percent=[0-100], compressor=lz4/zstd/deflate",
    recommendedValue: "zswap.enabled=1 zswap.max_pool_percent=15 zswap.compressor=zstd",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["memory", "swap", "zswap", "ddr5", "compression", "performance"],
    verboseDescription: "With your FX607V upgraded to 16 GB DDR5, swap thrashing to the NVMe SSD can still occur during extreme compilation or massive KDE Plasma memory leaks on Fedora 43 Rawhide. Zswap acts as a compressed RAM cache for swap pages. Setting max_pool_percent=15 restricts it to ~2.4 GB of your 16GB total, intercepting memory pages headed for the SSD, compressing them with zstd, and storing them in RAM. Throughput drops from NVMe speeds to RAM speeds — a major performance win. Recommended alongside zram for Rawhide development workloads.",
  },
  {
    id: "nvidia-modeset",
    name: "nvidia.NVreg_PreserveVideoMemoryAllocations=1",
    category: "Graphics Subsystem",
    relevanceHybrid: 88,
    relevanceDgpu: 92,
    switches: "=1 (Enabled), =0 (Disabled)",
    recommendedValue: "nvidia.NVreg_PreserveVideoMemoryAllocations=1",
    positionalParams: null,
    riskLevel: "moderate",
    tags: ["nvidia", "vram", "suspend", "hibernate", "memory"],
    verboseDescription: "Critical for suspend/resume stability with the NVIDIA RTX 4060 Mobile. Without this parameter, the NVIDIA driver frees VRAM allocations on system suspend, causing the GPU to lose its framebuffer state. On resume, KDE Plasma may fail to restore the display. Setting this to 1 instructs the driver to preserve video memory during sleep states. Essential on the FX607V since ASUS implements D3cold power states for the dGPU during battery save. Works in conjunction with the NVIDIA system services 'nvidia-suspend.service' and 'nvidia-resume.service' on Fedora.",
  },
  {
    id: "acpi-backlight",
    name: "acpi_backlight=vendor",
    category: "ASUS Firmware & ACPI",
    relevanceHybrid: 78,
    relevanceDgpu: 60,
    switches: "=vendor, =video, =native, =none",
    recommendedValue: "acpi_backlight=vendor",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["acpi", "backlight", "brightness", "asus", "display"],
    verboseDescription: "Controls which kernel subsystem manages display brightness. On the ASUS FX607V with BIOS v340, the default 'video' driver may conflict with the ASUS-specific ACPI backlight interface, resulting in brightness keys that work but don't actually change screen brightness, or a screen stuck at maximum brightness. 'vendor' forces the use of the ASUS-specific ACPI backlight interface. 'native' uses the display driver directly. Test 'vendor' first on Fedora 43 Rawhide — it resolves issues on most recent ASUS TUF models.",
  },
  {
    id: "amd-pstate",
    name: "amd_pstate=active",
    category: "CPU & Power Management",
    relevanceHybrid: 82,
    relevanceDgpu: 70,
    switches: "=active (CPPC preferred), =passive (scaled), =guided",
    recommendedValue: "amd_pstate=active",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["cpu", "pstate", "power", "performance", "amd", "ryzen"],
    verboseDescription: "NOTE: Only relevant if your FX607V has an AMD CPU variant. For the Intel Core i7-13650HX variant, use intel_pstate instead. 'amd_pstate=active' enables Collaborative Processor Performance Control (CPPC), allowing the CPU and OS to cooperatively manage frequency scaling. This provides finer-grained frequency steps than the legacy ACPI cpufreq driver, reducing power consumption during idle states while maintaining burst performance. On Fedora 43 Rawhide, 'active' mode is preferred over 'guided' for KDE Plasma workloads with frequent burst activity.",
  },
  {
    id: "intel-pstate",
    name: "intel_pstate=active",
    category: "CPU & Power Management",
    relevanceHybrid: 85,
    relevanceDgpu: 72,
    switches: "=active, =passive, =no_hwp, =force, =off",
    recommendedValue: "intel_pstate=active",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["cpu", "intel", "pstate", "hwp", "power", "performance"],
    verboseDescription: "For the Intel Core i7-13650HX in the ASUS FX607V. The 'intel_pstate' driver manages CPU frequency scaling using Intel's Hardware-Controlled Performance (HWP). 'active' mode (default) uses HWP with the kernel EPP (Energy Performance Preference) hint. 'passive' hands control to the generic CPUfreq governors (schedutil, powersave). If you experience thermal throttling or unpredictable boost behavior on Fedora 43 Rawhide, try 'passive' with the 'schedutil' governor, which is better integrated with the Linux scheduler's load metrics on modern Intel 13th-gen hybrid architectures.",
  },
  {
    id: "mem-sleep-default",
    name: "mem_sleep_default=deep",
    category: "CPU & Power Management",
    relevanceHybrid: 72,
    relevanceDgpu: 50,
    switches: "=deep (S3 suspend-to-RAM), =s2idle (S0ix connected standby)",
    recommendedValue: "mem_sleep_default=deep",
    positionalParams: null,
    riskLevel: "moderate",
    tags: ["sleep", "suspend", "power", "s3", "acpi", "battery"],
    verboseDescription: "On many modern ASUS laptops including the FX607V, the ASUS BIOS v340 may default to 's2idle' (Modern Standby / S0ix), which keeps the system in a low-power connected state rather than fully suspending. This can cause excessive battery drain during sleep on Linux. Forcing 'mem_sleep_default=deep' selects S3 (traditional suspend-to-RAM), which properly powers down most subsystems including the PCIe bus and GPU. This dramatically reduces sleep power consumption. Verify BIOS settings also have 'Sleep Type' set to 'S3' — some ASUS BIOS versions only expose S0ix.",
  },
  {
    id: "kernel-lockdown",
    name: "lockdown=integrity",
    category: "Security & Integrity",
    relevanceHybrid: 40,
    relevanceDgpu: 40,
    switches: "=integrity, =confidentiality, =none",
    recommendedValue: "Omit on development systems, use on production",
    positionalParams: null,
    riskLevel: "advanced",
    tags: ["security", "lockdown", "secureboot", "kernel", "modules"],
    verboseDescription: "Kernel Lockdown restricts actions that could compromise kernel integrity. 'integrity' mode prevents unsigned kernel modules from loading and blocks /dev/mem access. CRITICAL: On Fedora 43 Rawhide, this WILL block proprietary NVIDIA drivers unless they are signed with your Secure Boot key via 'mokutil'. On a development release, this parameter is generally counterproductive — it prevents loading out-of-tree modules needed for testing. Only add this parameter if you have enrolled your MOK (Machine Owner Key) with 'mokutil --import' and have signed the NVIDIA .ko files.",
  },
  {
    id: "mitigations-off",
    name: "mitigations=off",
    category: "Security & Integrity",
    relevanceHybrid: 35,
    relevanceDgpu: 45,
    switches: "=off (all disabled), =auto (default), =auto,nosmt",
    recommendedValue: "mitigations=auto (default, omit this flag)",
    positionalParams: null,
    riskLevel: "advanced",
    tags: ["security", "spectre", "meltdown", "performance", "cpu"],
    verboseDescription: "Disables all CPU vulnerability mitigations (Spectre, Meltdown, MDS, TAA, etc.). On the Intel Core i7-13650HX, mitigations have a measurable performance impact — approximately 5-15% on workloads with heavy syscall rates. 'mitigations=off' recovers this performance at the cost of exposing the system to CPU side-channel attacks. SECURITY WARNING: Appropriate ONLY for isolated development VMs or bare-metal systems with complete physical security. Never use on systems with untrusted users or public network exposure. The FX607V running Fedora 43 Rawhide as a development machine may benefit marginally from this in air-gapped environments.",
  },
  {
    id: "transparent-hugepages",
    name: "transparent_hugepage=madvise",
    category: "Memory & Hardware Isolation",
    relevanceHybrid: 65,
    relevanceDgpu: 65,
    switches: "=always, =madvise, =never",
    recommendedValue: "transparent_hugepage=madvise",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["memory", "hugepages", "thp", "performance", "ddr5"],
    verboseDescription: "Controls Transparent Huge Page (THP) allocation behavior. 'always' eagerly allocates 2MB pages, reducing TLB pressure but increasing latency during allocation. 'madvise' only uses huge pages for memory regions that explicitly request them via the madvise() syscall, providing better control. 'never' disables THP entirely, which some Redis and Java workloads actually prefer. For Fedora 43 Rawhide with 16GB DDR5 on the FX607V, 'madvise' is the most balanced choice — KDE Plasma and typical development workloads benefit from selective huge page use without the fragmentation overhead of 'always'.",
  },
  {
    id: "rd-luks",
    name: "rd.luks.options=discard",
    category: "Storage & Filesystem",
    relevanceHybrid: 70,
    relevanceDgpu: 70,
    switches: "discard, no-read-workqueue, no-write-workqueue, same-cpu-crypt",
    recommendedValue: "rd.luks.options=discard,no-read-workqueue,no-write-workqueue",
    positionalParams: null,
    riskLevel: "moderate",
    tags: ["luks", "encryption", "nvme", "storage", "discard", "trim"],
    verboseDescription: "Optimizes LUKS full-disk encryption for NVMe SSDs. 'discard' enables TRIM/discard passthrough to the SSD, essential for maintaining performance and longevity on NVMe drives — without it, the encrypted volume can't inform the SSD which blocks are free. 'no-read-workqueue' and 'no-write-workqueue' bypass dm-crypt's async work queues for synchronous I/O, reducing latency for random reads/writes. Significant on Fedora 43 Rawhide where dracut initializes the LUKS volume early. Security note: 'discard' slightly leaks information about encrypted data layout to physical attackers — acceptable for most laptop threat models.",
  },
  {
    id: "rootflags-subvol",
    name: "rootflags=subvol=root",
    category: "Storage & Filesystem",
    relevanceHybrid: 95,
    relevanceDgpu: 95,
    switches: "subvol=<name>, subvolid=<id>, compress=zstd:3, autodefrag",
    recommendedValue: "rootflags=subvol=root,compress=zstd:3",
    positionalParams: "subvol name (positional in BTRFS mount args)",
    riskLevel: "safe",
    tags: ["btrfs", "subvolume", "filesystem", "fedora", "root"],
    verboseDescription: "Specifies BTRFS subvolume mount options passed to the kernel at boot. 'subvol=root' mounts the 'root' subvolume as the root filesystem — standard Fedora BTRFS layout. Adding 'compress=zstd:3' enables real-time BTRFS transparent compression with zstd at compression level 3. On the FX607V's NVMe SSD, this trades negligible CPU overhead (your i7-13650HX handles zstd extremely efficiently) for 20-40% storage savings on typical filesystems, reduced write amplification, and extended SSD lifespan. Particularly effective on Fedora 43 Rawhide's development package cache which contains many compressible RPM files.",
  },
  {
    id: "systemd-debug",
    name: "systemd.log_level=debug",
    category: "Diagnostics & Verbosity",
    relevanceHybrid: 45,
    relevanceDgpu: 45,
    switches: "=debug, =info, =warning, =err, =crit",
    recommendedValue: "systemd.log_level=debug (use only for debugging boots)",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["systemd", "debug", "logging", "diagnostics", "boot"],
    verboseDescription: "Forces systemd to emit debug-level logs during boot, captured by journald. On Fedora 43 Rawhide — a development release where services may fail silently — this is invaluable for tracing service dependency failures, socket activation issues, or udev rule conflicts during early boot. The ASUS FX607V v340 BIOS can trigger unusual ACPI device enumeration that confuses systemd-udevd; debug logging captures the exact device probe sequence. After capturing the journal with 'journalctl -b', restore normal logging by removing this parameter to avoid journal storage bloat.",
  },
  {
    id: "numa-off",
    name: "numa=off",
    category: "Memory & Hardware Isolation",
    relevanceHybrid: 25,
    relevanceDgpu: 25,
    switches: "=off",
    recommendedValue: "Omit — not applicable to single-socket laptops",
    positionalParams: null,
    riskLevel: "moderate",
    tags: ["numa", "memory", "topology", "performance"],
    verboseDescription: "Disables NUMA (Non-Uniform Memory Access) topology awareness in the kernel. The FX607V is a single-socket laptop with a single memory controller, so true NUMA does not apply. However, some BIOSes (including certain ASUS versions) incorrectly expose fake NUMA nodes via ACPI SRAT tables, confusing the kernel memory allocator and causing suboptimal page allocation. If your BIOS v340 reports multiple NUMA nodes in /proc/buddyinfo, enabling 'numa=off' flattens the topology and restores optimal memory allocation. Check with 'numactl --hardware' before applying.",
  },
  {
    id: "nvidia-open",
    name: "nvidia_drm.fbdev=1",
    category: "Graphics Subsystem",
    relevanceHybrid: 72,
    relevanceDgpu: 88,
    switches: "=1 (Enable framebuffer device), =0 (Disabled)",
    recommendedValue: "nvidia_drm.fbdev=1",
    positionalParams: null,
    riskLevel: "moderate",
    tags: ["nvidia", "framebuffer", "drm", "console", "tty"],
    verboseDescription: "Enables the NVIDIA DRM framebuffer device, allowing the Linux kernel's VT (virtual terminal) console to use the NVIDIA GPU directly instead of falling back to efifb or vesafb. On Fedora 43 Rawhide, this resolves the 'black screen' issue between GRUB and the KDE SDDM login manager where the framebuffer handoff fails silently. Required when using the open-source NVIDIA kernel module (nvidia-open) on RTX 40-series GPUs. The RTX 4060 Mobile in the FX607V supports GSP (GPU System Processor) firmware which is required for nvidia-open module compatibility on Fedora.",
  },
  {
    id: "rd-timeout",
    name: "rd.timeout=90",
    category: "Storage & Filesystem",
    relevanceHybrid: 55,
    relevanceDgpu: 55,
    switches: "=<seconds> (integer, default is kernel/dracut default)",
    recommendedValue: "rd.timeout=90",
    positionalParams: "timeout value in seconds",
    riskLevel: "safe",
    tags: ["dracut", "boot", "timeout", "storage", "luks"],
    verboseDescription: "Sets the maximum time dracut (the initramfs generator) will wait for devices to appear before giving up and dropping to an emergency shell. On Fedora 43 Rawhide, the NVMe device on the FX607V normally appears within 2-3 seconds, but encrypted LUKS volumes or BTRFS arrays can occasionally take longer, especially after an unclean shutdown. If you see 'Warning: /dev/disk/by-uuid/... does not exist' during boot followed by a 90-second countdown, this parameter extends that window. Increase to 90 if LUKS prompt timing is unreliable.",
  },
  {
    id: "audit-off",
    name: "audit=0",
    category: "Security & Integrity",
    relevanceHybrid: 50,
    relevanceDgpu: 50,
    switches: "=0 (Disabled), =1 (Enabled, default)",
    recommendedValue: "audit=0 (development systems only)",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["audit", "security", "performance", "syscall", "selinux"],
    verboseDescription: "Disables the Linux Audit subsystem at boot. On Fedora 43 Rawhide with SELinux enabled, the audit subsystem logs every SELinux AVC denial, policy lookup, and security event. While essential for production security hardening, on a development system with frequent AVC denials from new/unsigned software, audit logging adds measurable overhead to syscall paths and fills journald rapidly. Disabling with 'audit=0' removes this overhead. WARNING: This also disables auditd-based intrusion detection. Appropriate for isolated development workstations — restore 'audit=1' on any system handling sensitive data.",
  },
  {
    id: "usbcore-autosuspend",
    name: "usbcore.autosuspend=-1",
    category: "CPU & Power Management",
    relevanceHybrid: 60,
    relevanceDgpu: 55,
    switches: "=-1 (Disabled), =0 (Immediate), =<seconds>",
    recommendedValue: "usbcore.autosuspend=-1 (if USB devices behave erratically)",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["usb", "power", "autosuspend", "peripheral"],
    verboseDescription: "Controls the USB autosuspend timeout, which automatically powers down idle USB devices to save energy. The default allows the kernel to suspend unused USB devices after 2 seconds. On the ASUS FX607V, certain USB peripherals (particularly USB-C docks, gaming mice with firmware, and the internal USB hub connecting the keyboard controller) can behave erratically or lose connectivity when autosuspended. Setting to -1 disables autosuspend globally. For targeted control, use udev rules to disable autosuspend per-device without affecting others — see /sys/bus/usb/devices/*/power/autosuspend.",
  },
  {
    id: "video-port",
    name: "video=eDP-1:1920x1080@144",
    category: "Display & Output",
    relevanceHybrid: 65,
    relevanceDgpu: 80,
    switches: "video=<connector>:<resolution>@<refresh>, video=HDMI-A-1:1920x1080@60",
    recommendedValue: "video=eDP-1:1920x1080@144",
    positionalParams: "connector name, resolution string (WxH), refresh rate (Hz)",
    riskLevel: "safe",
    tags: ["display", "resolution", "edp", "refresh", "144hz", "framebuffer"],
    verboseDescription: "Forces the kernel framebuffer to a specific resolution and refresh rate on a named connector. The ASUS FX607V features a 144Hz FHD (1920x1080) IPS display on the internal eDP connector. During early boot before the NVIDIA or Intel driver takes control, the kernel framebuffer defaults to a lower resolution. Specifying 'video=eDP-1:1920x1080@144' maintains native resolution throughout the boot sequence, preventing resolution flicker at SDDM login. In dGPU mode with PRIME output, the display may be named differently — check 'xrandr' or 'kscreen-doctor --outputs' to identify the correct connector name.",
  },
  {
    id: "rd-blacklist-nouveau",
    name: "rd.blacklist=nouveau",
    category: "Graphics Subsystem",
    relevanceHybrid: 75,
    relevanceDgpu: 98,
    switches: "=<module_name> (dracut-specific early blacklist)",
    recommendedValue: "rd.blacklist=nouveau",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["dracut", "nouveau", "blacklist", "initrd", "early-boot"],
    verboseDescription: "Dracut-specific parameter to blacklist the nouveau module during the initramfs phase — before the regular modprobe.blacklist takes effect. This is the earliest possible stage to prevent nouveau from loading. Critical distinction from 'rd.driver.blacklist': this parameter is processed by the dracut-specific cmdline hook, while 'rd.driver.blacklist' is processed by the dracut network/driver detection hook. Use both for complete coverage. The ASUS FX607V's RTX 4060 Mobile has excellent nouveau support in theory, but its presence conflicts catastrophically with the proprietary NVIDIA 550+ drivers on Fedora 43 Rawhide.",
  },
  {
    id: "btrfs-compression",
    name: "rootflags=compress=zstd:3",
    category: "Storage & Filesystem",
    relevanceHybrid: 68,
    relevanceDgpu: 68,
    switches: "compress=zstd:1-22, compress=lzo, compress=zlib:1-9, compress-force=<algo>",
    recommendedValue: "rootflags=subvol=root,compress=zstd:3",
    positionalParams: "compression algorithm name, compression level",
    riskLevel: "safe",
    tags: ["btrfs", "compression", "zstd", "storage", "performance"],
    verboseDescription: "Enables BTRFS transparent filesystem compression at the kernel level. Level 3 provides the best balance between compression ratio and CPU overhead for the Intel Core i7-13650HX — lower levels (1-2) compress faster with less ratio; higher levels (4+) compress better but add perceptible latency to write paths. 'compress-force' applies compression even to data that may not compress well (useful for forcing uniform behavior). On Fedora 43 Rawhide, the development package cache, source trees, and compiled intermediate objects compress 30-50%, significantly reducing NVMe write amplification and extending drive longevity over years of development use.",
  },
  {
    id: "nmi-watchdog",
    name: "nmi_watchdog=0",
    category: "CPU & Power Management",
    relevanceHybrid: 40,
    relevanceDgpu: 40,
    switches: "=0 (Disabled), =1 (Enabled via perf events), =2 (Enabled via I/O APIC)",
    recommendedValue: "nmi_watchdog=0 (saves power, minor perf benefit)",
    positionalParams: null,
    riskLevel: "safe",
    tags: ["watchdog", "nmi", "power", "performance", "cpu"],
    verboseDescription: "The NMI (Non-Maskable Interrupt) watchdog uses hardware performance counters to detect kernel hangs. Disabling it frees one PMU (Performance Monitoring Unit) counter for use by perf, eBPF tools, and profiling applications — valuable on Fedora 43 Rawhide development systems where perf/BPF tooling is frequently used. Also reduces power consumption marginally since the watchdog generates periodic NMI interrupts. On stable production systems, keep this enabled. On a Fedora Rawhide development machine where kernel panics are occasionally expected (it's a pre-release!), the watchdog overhead outweighs its benefit.",
  },
  {
    id: "selinux-permissive",
    name: "enforcing=0",
    category: "Security & Integrity",
    relevanceHybrid: 55,
    relevanceDgpu: 55,
    switches: "=0 (Permissive/log-only), =1 (Enforcing, default)",
    recommendedValue: "enforcing=0 (Rawhide development only, remove for production)",
    positionalParams: null,
    riskLevel: "advanced",
    tags: ["selinux", "security", "permissive", "avc", "fedora"],
    verboseDescription: "Places SELinux in Permissive mode — policy violations are logged but not blocked. On Fedora 43 Rawhide, new kernel features, unsigned drivers, and experimental software frequently generate SELinux AVC denials that block execution in Enforcing mode. Setting 'enforcing=0' at boot allows the system to function while you audit denials with 'ausearch -m avc' and generate policy fixes with 'audit2allow'. SECURITY WARNING: Permissive mode provides NO MAC (Mandatory Access Control) protection. Legitimate for isolated development workstations testing unstable Fedora packages. Absolutely prohibited on any multi-user or network-facing system.",
  },
  {
    id: "tsc-reliable",
    name: "tsc=reliable",
    category: "CPU & Power Management",
    relevanceHybrid: 48,
    relevanceDgpu: 48,
    switches: "=reliable, =unstable, =nowatchdog",
    recommendedValue: "Omit unless experiencing clock instability",
    positionalParams: null,
    riskLevel: "moderate",
    tags: ["tsc", "clocksource", "timing", "cpu", "intel"],
    verboseDescription: "Instructs the kernel to trust the Time Stamp Counter (TSC) as a reliable clocksource. On the Intel Core i7-13650HX, the TSC is hardware-synchronized across efficiency and performance cores using Intel's TSC invariant feature. Normally, the kernel self-detects TSC reliability. If you see kernel messages about 'TSC being unstable' or 'clocksource: Switched to clocksource tsc-early' followed by time drift in KDE Plasma system clock, explicitly marking TSC as reliable stops the fallback to HPET (which is slower). On ASUS BIOS v340, this is rarely needed but may help if BIOS configures C-state transitions aggressively.",
  },
];

router.get("/parameters", (req: Request, res: Response) => {
  const { category, graphicsMode, search, riskLevel } = req.query as Record<string, string>;
  let results = [...PARAMETERS];

  if (category) {
    results = results.filter((p) => p.category === category);
  }
  if (riskLevel) {
    results = results.filter((p) => p.riskLevel === riskLevel);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.verboseDescription.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.category.toLowerCase().includes(q),
    );
  }

  // Sort by relevance for the chosen graphics mode
  if (graphicsMode === "dgpu") {
    results.sort((a, b) => b.relevanceDgpu - a.relevanceDgpu);
  } else {
    results.sort((a, b) => b.relevanceHybrid - a.relevanceHybrid);
  }

  res.json(results);
});

router.get("/parameters/:id", (req: Request, res: Response) => {
  const param = PARAMETERS.find((p) => p.id === req.params["id"]);
  if (!param) {
    res.status(404).json({ error: "Parameter not found" });
    return;
  }
  res.json(param);
});

router.get("/categories", (_req: Request, res: Response) => {
  const categoryMeta: Record<string, string> = {
    "Graphics Subsystem": "NVIDIA, Intel iGPU, DRM, Wayland, display output",
    "Memory & Hardware Isolation": "IOMMU, VRAM, DDR5 tuning, THP, zswap",
    "ASUS Firmware & ACPI": "BIOS v340 quirks, hotkeys, backlight, ACPI tables",
    "CPU & Power Management": "Intel P-state, sleep states, TSC, watchdog",
    "Storage & Filesystem": "BTRFS, LUKS, NVMe, dracut, compression",
    "Diagnostics & Verbosity": "Kernel log verbosity, systemd debug, RHGB",
    "Security & Integrity": "SELinux, kernel lockdown, mitigations, audit",
    "Display & Output": "Resolution, refresh rate, framebuffer, connectors",
  };

  const counts: Record<string, number> = {};
  PARAMETERS.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  const categories = Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    description: categoryMeta[name] || "",
  }));

  res.json(categories);
});

router.get("/stats", (_req: Request, res: Response) => {
  const categoryCounts: Record<string, number> = {};
  const riskCounts = { safe: 0, moderate: 0, advanced: 0 };

  PARAMETERS.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    riskCounts[p.riskLevel as keyof typeof riskCounts]++;
  });

  const topHybrid = [...PARAMETERS]
    .sort((a, b) => b.relevanceHybrid - a.relevanceHybrid)
    .slice(0, 5)
    .map(({ id, name, relevanceHybrid }) => ({ id, name, relevanceHybrid }));

  const topDgpu = [...PARAMETERS]
    .sort((a, b) => b.relevanceDgpu - a.relevanceDgpu)
    .slice(0, 5)
    .map(({ id, name, relevanceDgpu }) => ({ id, name, relevanceDgpu }));

  res.json({
    totalParameters: PARAMETERS.length,
    categoryCounts: Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    })),
    riskCounts,
    topHybridParams: topHybrid,
    topDgpuParams: topDgpu,
  });
});

export default router;
