let intervalId = null; // 存储定时器的ID
self.onmessage = function(e) {
	// onsole.log('endTime and startTime', endTime, startTime);
	// self.postMessage({ type: 'log', endTime: endTime, startTime: startTime});
	// 清除之前的定时器（如果有的话）
	if (intervalId !== null) {
		return;
	}
    intervalId = setInterval(() => {
		let endTime = e.data + 8 * 3600 * 1000; // 修正这里
		let startTime = new Date().getTime(); // 初始化开始时间
		let dateObj = new Date(startTime); // 使用毫秒数创建一个Date对象
		let midnight = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
		// 计算从午夜到当前时间的毫秒数
		startTime = startTime - midnight.getTime();
        let remainingTime = endTime - startTime; // 使用当前时间计算剩余时间
        if (remainingTime <= 0) {
            clearInterval(intervalId);
			intervalId = null;
            self.postMessage({ hours: 0, minutes: 0, seconds: 0 }); // 修正语法
        } else {
            let totalSeconds = Math.floor(remainingTime / 1000);
            let hours = Math.floor(totalSeconds / 3600);
            let minutes = Math.floor((totalSeconds % 3600) / 60);
            let seconds = totalSeconds % 60;
            self.postMessage({ hours, minutes, seconds });
        }
    }, 1000);
};