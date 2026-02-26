/**
 * 轮播图模块
 * 负责欢迎横幅的轮播功能
 */

class SliderManager {
    constructor() {
        this.currentSlideIndex = 0;
        this.sliderInterval = null;
        this.autoPlayDelay = 5000; // 5秒
        this.pauseDelay = 3000; // 手动切换后暂停3秒
    }

    // 初始化轮播图
    init() {
        this.bindEvents();
        this.startAutoPlay();
    }

    // 绑定事件
    bindEvents() {
        const banner = document.querySelector('.welcome-banner');
        if (!banner) return;

        // 鼠标悬停暂停/恢复
        banner.addEventListener('mouseenter', () => this.stopAutoPlay());
        banner.addEventListener('mouseleave', () => this.startAutoPlay());

        // 触摸事件支持
        let touchStartX = 0;
        let touchEndX = 0;

        banner.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        banner.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }

    // 处理滑动
    handleSwipe(startX, endX) {
        const threshold = 50; // 滑动阈值
        const diff = startX - endX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // 向左滑动，下一张
                this.nextSlide();
            } else {
                // 向右滑动，上一张
                this.prevSlide();
            }
        }
    }

    // 开始自动播放
    startAutoPlay() {
        this.stopAutoPlay(); // 清除之前的定时器
        this.sliderInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoPlayDelay);
    }

    // 停止自动播放
    stopAutoPlay() {
        if (this.sliderInterval) {
            clearInterval(this.sliderInterval);
            this.sliderInterval = null;
        }
    }

    // 切换到下一张
    nextSlide() {
        const slides = document.querySelectorAll('.welcome-banner-slide');
        const indicators = document.querySelectorAll('.welcome-banner-slider-indicators button');
        
        if (slides.length === 0) return;

        this.setSlide((this.currentSlideIndex + 1) % slides.length);
    }

    // 切换到上一张
    prevSlide() {
        const slides = document.querySelectorAll('.welcome-banner-slide');
        
        if (slides.length === 0) return;

        this.setSlide(this.currentSlideIndex === 0 ? slides.length - 1 : this.currentSlideIndex - 1);
    }

    // 设置指定幻灯片
    setSlide(index) {
        const slides = document.querySelectorAll('.welcome-banner-slide');
        const indicators = document.querySelectorAll('.welcome-banner-slider-indicators button');
        
        if (slides.length === 0 || index < 0 || index >= slides.length) return;

        // 移除当前活动状态
        slides[this.currentSlideIndex].classList.remove('active');
        if (indicators[this.currentSlideIndex]) {
            indicators[this.currentSlideIndex].classList.remove('active');
        }

        // 设置新的活动状态
        this.currentSlideIndex = index;
        slides[this.currentSlideIndex].classList.add('active');
        if (indicators[this.currentSlideIndex]) {
            indicators[this.currentSlideIndex].classList.add('active');
        }

        // 手动切换后暂停自动播放
        this.stopAutoPlay();
        setTimeout(() => {
            this.startAutoPlay();
        }, this.pauseDelay);
    }

    // 手动切换到指定幻灯片
    goToSlide(index) {
        this.setSlide(index);
    }

    // 获取当前幻灯片索引
    getCurrentSlide() {
        return this.currentSlideIndex;
    }

    // 获取总幻灯片数
    getTotalSlides() {
        const slides = document.querySelectorAll('.welcome-banner-slide');
        return slides.length;
    }

    // 添加新幻灯片
    addSlide(imageUrl, overlayColor = 'rgba(0,0,0,0.4)') {
        const slider = document.querySelector('.welcome-banner-slider');
        const indicators = document.querySelector('.welcome-banner-slider-indicators');
        
        if (!slider || !indicators) return;

        // 创建新的幻灯片
        const slide = document.createElement('div');
        slide.className = 'welcome-banner-slide';
        slide.style.backgroundImage = `linear-gradient(${overlayColor}, ${overlayColor}), url('${imageUrl}')`;
        slider.appendChild(slide);

        // 创建对应的指示器
        const indicator = document.createElement('button');
        indicator.onclick = () => this.goToSlide(this.getTotalSlides());
        indicators.appendChild(indicator);

        return this.getTotalSlides() - 1; // 返回新幻灯片的索引
    }

    // 移除幻灯片
    removeSlide(index) {
        const slides = document.querySelectorAll('.welcome-banner-slide');
        const indicators = document.querySelectorAll('.welcome-banner-slider-indicators button');
        
        if (index < 0 || index >= slides.length || slides.length <= 1) return;

        // 移除幻灯片和指示器
        slides[index].remove();
        if (indicators[index]) {
            indicators[index].remove();
        }

        // 如果移除的是当前活动幻灯片，调整索引
        if (index === this.currentSlideIndex) {
            this.currentSlideIndex = Math.max(0, index - 1);
            this.setSlide(this.currentSlideIndex);
        } else if (index < this.currentSlideIndex) {
            this.currentSlideIndex--;
        }
    }

    // 更新幻灯片图片
    updateSlideImage(index, imageUrl, overlayColor = 'rgba(0,0,0,0.4)') {
        const slides = document.querySelectorAll('.welcome-banner-slide');
        
        if (index < 0 || index >= slides.length) return;

        slides[index].style.backgroundImage = `linear-gradient(${overlayColor}, ${overlayColor}), url('${imageUrl}')`;
    }

    // 销毁轮播图
    destroy() {
        this.stopAutoPlay();
        // 移除事件监听器（这里简化处理，实际应该保存引用以便移除）
    }
}

// 创建全局实例
window.sliderManager = new SliderManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (window.sliderManager) {
        window.sliderManager.init();
    }
});