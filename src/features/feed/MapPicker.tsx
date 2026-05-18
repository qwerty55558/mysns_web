"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaceDraft } from "./PlacePicker";

const MAP_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KakaoNS = any;

declare global {
  interface Window {
    kakao?: KakaoNS;
  }
}

let sdkPromise: Promise<void> | null = null;
function loadKakaoSdk(): Promise<void> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("브라우저 환경이 아닙니다"));
  if (window.kakao?.maps?.services) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  if (!MAP_APP_KEY)
    return Promise.reject(
      new Error("NEXT_PUBLIC_KAKAO_MAPS_APP_KEY 가 설정되지 않았어요"),
    );
  sdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${MAP_APP_KEY}&libraries=services`;
    s.onload = () => {
      window.kakao.maps.load(() => resolve());
    };
    s.onerror = () => reject(new Error("카카오 맵 SDK 로드 실패"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

type Poi = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  categoryName: string;
  categoryCode: string;
  distance: number;
};

type KakaoPlaceDoc = {
  id: string;
  place_name: string;
  road_address_name?: string;
  address_name?: string;
  x: string;
  y: string;
  category_name?: string;
  category_group_name?: string;
  category_group_code?: string;
  distance?: string;
};

function toPoi(d: KakaoPlaceDoc): Poi {
  return {
    id: d.id,
    name: d.place_name,
    address: d.road_address_name || d.address_name || "",
    lat: Number(d.y),
    lng: Number(d.x),
    categoryName:
      d.category_group_name ||
      (d.category_name || "").split(" > ").pop() ||
      "",
    categoryCode: d.category_group_code || "",
    distance: Number(d.distance) || 0,
  };
}

function searchViaSdk(
  mode: "keyword" | "category",
  param: string,
  lat: number,
  lng: number,
): Promise<Poi[]> {
  return new Promise((resolve, reject) => {
    const kakao = window.kakao;
    if (!kakao?.maps?.services) {
      reject(new Error("SDK services 라이브러리 미로드"));
      return;
    }
    const places = new kakao.maps.services.Places();
    const options = {
      location: new kakao.maps.LatLng(lat, lng),
      radius: mode === "keyword" ? 1500 : 1000,
      sort: kakao.maps.services.SortBy.DISTANCE,
      size: 15,
    };
    const cb = (data: KakaoPlaceDoc[], status: string) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve(data.map(toPoi));
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        resolve([]);
      } else {
        reject(new Error(`POI 검색 실패 (${status})`));
      }
    };
    if (mode === "keyword") {
      places.keywordSearch(param, cb, options);
    } else {
      places.categorySearch(param, cb, options);
    }
  });
}

export function MapPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (place: PlaceDraft) => void;
}) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Poi[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const configMissing = !MAP_APP_KEY;

  // 모달 열릴 때 좌표 + SDK
  useEffect(() => {
    if (!open || configMissing) return;
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("이 브라우저에서는 위치를 가져올 수 없어요.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => setError(err.message || "위치 가져오기 실패"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );

    loadKakaoSdk()
      .then(() => setSdkReady(true))
      .catch((e) => setError(e instanceof Error ? e.message : "SDK 로드 실패"));
  }, [open, configMissing]);

  // 맵 초기화
  useEffect(() => {
    if (!open || !sdkReady || !coords || !mapRef.current) return;
    const kakao = window.kakao!;
    const center = new kakao.maps.LatLng(coords.lat, coords.lng);
    if (!mapInstance.current) {
      mapInstance.current = new kakao.maps.Map(mapRef.current, {
        center,
        level: 3,
      });
      new kakao.maps.Marker({
        position: center,
        map: mapInstance.current,
        image: new kakao.maps.MarkerImage(
          "data:image/svg+xml;base64," +
            btoa(
              `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8" fill="#03c75a" stroke="#fff" stroke-width="3"/></svg>`,
            ),
          new kakao.maps.Size(22, 22),
          { offset: new kakao.maps.Point(11, 11) },
        ),
      });
    } else {
      mapInstance.current.setCenter(center);
    }
  }, [open, sdkReady, coords]);

  // 결과 마커
  useEffect(() => {
    if (!mapInstance.current || !sdkReady) return;
    const kakao = window.kakao!;
    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [];
    if (results.length === 0) return;
    const bounds = new kakao.maps.LatLngBounds();
    for (const poi of results) {
      const pos = new kakao.maps.LatLng(poi.lat, poi.lng);
      const marker = new kakao.maps.Marker({ position: pos });
      marker.setMap(mapInstance.current);
      kakao.maps.event.addListener(marker, "click", () => {
        onSelect({
          latitude: poi.lat,
          longitude: poi.lng,
          name: poi.name,
          address: poi.address,
          externalId: poi.id,
          categoryName: poi.categoryName || null,
          categoryCode: poi.categoryCode || null,
        });
        onClose();
      });
      markersRef.current.push(marker);
      bounds.extend(pos);
    }
    mapInstance.current.setBounds(bounds);
  }, [results, sdkReady, onSelect, onClose]);

  const doKeywordSearch = useCallback(async () => {
    if (!coords || !sdkReady || query.trim().length === 0) return;
    setSearching(true);
    setError(null);
    try {
      const r = await searchViaSdk("keyword", query.trim(), coords.lat, coords.lng);
      setResults(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 실패");
    } finally {
      setSearching(false);
    }
  }, [coords, sdkReady, query]);

  // SDK + 좌표 준비되고 검색어 비어있을 때: 주변 음식점 카테고리 안전망
  useEffect(() => {
    if (!open || !coords || !sdkReady || query.trim() !== "") return;
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const r = await searchViaSdk("category", "FD6", coords.lat, coords.lng);
        if (!cancelled) setResults(r);
      } catch {
        /* 사용자가 검색하면 됨 */
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, coords, sdkReady, query]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-[color:var(--paper)] shadow-2xl sm:h-[600px] sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-[color:var(--rule)] px-4 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void doKeywordSearch();
              }
            }}
            placeholder="가게/장소 이름으로 검색 (예: 스타벅스)"
            className="flex-1 rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-1.5 text-[13.5px] outline-none focus:border-[color:var(--foreground)]/40"
          />
          <button
            type="button"
            onClick={() => void doKeywordSearch()}
            disabled={!coords || !sdkReady || searching}
            className="rounded-md bg-pay px-3 py-1.5 text-[12px] font-semibold text-[color:var(--pay-on)] disabled:opacity-50"
          >
            {searching ? "…" : "검색"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-[20px] text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
          >
            ×
          </button>
        </div>

        {configMissing ? (
          <ConfigMissingNotice />
        ) : (
          <>
            <div
              ref={mapRef}
              className="h-[50%] w-full bg-[color:var(--rule)]/30"
            />
            <div className="flex-1 overflow-y-auto">
              {error && (
                <p className="px-4 py-3 text-[12.5px] text-[color:var(--danger)]">
                  {error}
                </p>
              )}
              {!coords && !error && (
                <p className="px-4 py-3 text-[12.5px] text-[color:var(--ink-soft)]">
                  현재 위치를 가져오는 중…
                </p>
              )}
              {results.length === 0 && coords && !searching && !error && (
                <p className="px-4 py-3 text-[12.5px] text-[color:var(--ink-soft)]">
                  검색어를 입력해 주변 장소를 찾아보세요.
                </p>
              )}
              <ul className="divide-y divide-[color:var(--rule)]">
                {results.map((poi) => (
                  <li key={poi.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect({
                          latitude: poi.lat,
                          longitude: poi.lng,
                          name: poi.name,
                          address: poi.address,
                          externalId: poi.id,
                        });
                        onClose();
                      }}
                      className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-[color:var(--rule)]/40"
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="truncate text-[13.5px] font-semibold">
                          {poi.name}
                        </span>
                        {poi.distance > 0 && (
                          <span className="font-mono text-[11px] tabular-nums text-[color:var(--ink-soft)]">
                            {formatDistance(poi.distance)}
                          </span>
                        )}
                      </span>
                      {poi.categoryName && (
                        <span className="text-[11px] text-[color:var(--pay-forest)]">
                          {poi.categoryName}
                        </span>
                      )}
                      {poi.address && (
                        <span className="truncate text-[11.5px] text-[color:var(--ink-soft)]">
                          {poi.address}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ConfigMissingNotice() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center text-[13px]">
      <p className="font-semibold">카카오 지도 키가 설정되지 않았어요</p>
      <p className="text-[color:var(--ink-soft)]">
        <code className="rounded bg-[color:var(--rule)]/40 px-1.5 py-0.5 text-[11.5px]">
          .env.local
        </code>{" "}
        에 아래 키를 추가하고 재시작 하세요.
      </p>
      <pre className="rounded-lg bg-[color:var(--rule)]/30 px-3 py-2 text-left text-[11px] leading-relaxed">
        NEXT_PUBLIC_KAKAO_MAPS_APP_KEY=...
      </pre>
      <p className="text-[11.5px] text-[color:var(--ink-soft)]">
        Kakao Developers → 애플리케이션 → 앱 키 → JavaScript 키
        <br />
        Web 플랫폼에 http://localhost:3000 등록 필수
      </p>
    </div>
  );
}

function formatDistance(m: number): string {
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}
