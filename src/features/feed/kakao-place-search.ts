"use client";

import type { PlaceDraft } from "./PlacePicker";

const MAP_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY;

// MapPicker.tsx의 sdkPromise와 별개의 모듈 싱글톤이지만, kakao SDK 자체는
// document.head의 동일 <script> 1번만 로드되므로 충돌 없음.
let sdkPromise: Promise<void> | null = null;

function loadKakaoSdk(): Promise<void> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("브라우저 환경이 아닙니다"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.kakao?.maps?.services) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  if (!MAP_APP_KEY)
    return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_MAPS_APP_KEY 미설정"));
  sdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${MAP_APP_KEY}&libraries=services`;
    s.onload = () => w.kakao.maps.load(() => resolve());
    s.onerror = () => reject(new Error("카카오 맵 SDK 로드 실패"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

type KakaoPlaceDoc = {
  id: string;
  place_name: string;
  road_address_name?: string;
  address_name?: string;
  x: string;
  y: string;
  category_group_name?: string;
  category_group_code?: string;
};

// OCR로 뽑힌 가게명으로 카카오 Local 키워드 검색 → top 1 결과를 PlaceDraft로 반환.
// 위치 바이어스 없이 전국 검색(정확도 sort). 결과 0건 또는 SDK/키 문제 시 null.
export async function searchPlaceByName(
  name: string,
): Promise<PlaceDraft | null> {
  try {
    await loadKakaoSdk();
  } catch {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kakao = (window as any).kakao;
  return new Promise<PlaceDraft | null>((resolve) => {
    const places = new kakao.maps.services.Places();
    places.keywordSearch(
      name,
      (data: KakaoPlaceDoc[], status: string) => {
        if (status === kakao.maps.services.Status.OK && data.length > 0) {
          const d = data[0];
          resolve({
            latitude: Number(d.y),
            longitude: Number(d.x),
            name: d.place_name,
            address: d.road_address_name || d.address_name || null,
            externalId: d.id,
            categoryName: d.category_group_name || null,
            categoryCode: d.category_group_code || null,
          });
        } else {
          resolve(null);
        }
      },
      { size: 5 },
    );
  });
}
