import React, { useEffect } from 'react';
import './Snowfall.css';

const Snowfall = () => {
    useEffect(() => {
        const container = document.querySelector('.snowfall-container');

        if (!container) {
            console.error("Container '.snowfall-container' không tồn tại trong DOM!");
            return;
        }

        const createSnowflake = () => {
            const snowflake = document.createElement('div');
            snowflake.classList.add('snowflake');

            // Cài đặt thuộc tính ngẫu nhiên cho bông tuyết
            snowflake.style.backgroundImage = "url('/snowflake.png')";
            snowflake.style.width = `${Math.random() * 20 + 10}px`;
            snowflake.style.height = snowflake.style.width;
            snowflake.style.left = `${Math.random() * 100}vw`;
            snowflake.style.animationDuration = `${Math.random() * 5 + 5}s`; // Tốc độ rơi
            snowflake.style.opacity = Math.random();
            snowflake.style.animationName = Math.random() > 0.5 ? 'fall' : 'fall-spin'; // Hiệu ứng ngẫu nhiên

            container.appendChild(snowflake);

            // Xóa bông tuyết khi rơi xong
            snowflake.addEventListener('animationend', () => {
                snowflake.remove();
            });
        };

        const interval = setInterval(createSnowflake, 150); // Tạo bông tuyết đều đặn

        return () => clearInterval(interval);
    }, []);

    return <div className="snowfall-container"></div>;
};

export default Snowfall;
