import { Injectable, signal } from '@angular/core';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../core/firebase';
import { AppUser } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly GUEST_USER_KEY = 'lumos_guest_user';
  private readonly AUTH_USER_KEY = 'lumos_authenticated_user';

  readonly currentUser = signal<AppUser | null>(null);
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  constructor() {
    this.initNetworkListener();
    this.initSession();
  }

  private async initNetworkListener() {
    try {
      const status = await Network.getStatus();
      this.isOnline.set(status.connected);

      Network.addListener('networkStatusChange', (s) => {
        this.isOnline.set(s.connected);
      });
    } catch {
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => this.isOnline.set(true));
        window.addEventListener('offline', () => this.isOnline.set(false));
      }
    }
  }

  private async initSession() {
    // 1. Check if authenticated user was cached in Preferences
    try {
      const { value: cachedUserStr } = await Preferences.get({ key: this.AUTH_USER_KEY });
      if (cachedUserStr) {
        const cachedUser: AppUser = JSON.parse(cachedUserStr);
        this.currentUser.set(cachedUser);
      }
    } catch (e) {
      console.warn('Error reading cached user', e);
    }

    // 2. Listen to Firebase Auth state if available
    try {
      if (auth) {
        onAuthStateChanged(auth, async (fbUser: User | null) => {
          if (fbUser) {
            const appUser: AppUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || 'Usuario Lumos',
              photoURL: fbUser.photoURL || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
              isOfflineGuest: false,
              lastLogin: new Date().toISOString()
            };
            this.currentUser.set(appUser);
            await Preferences.set({ key: this.AUTH_USER_KEY, value: JSON.stringify(appUser) });
          } else if (!this.currentUser() || !this.currentUser()?.isOfflineGuest) {
            // No firebase user, initialize or restore guest session
            await this.initGuestSession();
          }
        });
      } else {
        await this.initGuestSession();
      }
    } catch {
      await this.initGuestSession();
    }
  }

  async initGuestSession(): Promise<AppUser> {
    try {
      const { value } = await Preferences.get({ key: this.GUEST_USER_KEY });
      if (value) {
        const guestUser: AppUser = JSON.parse(value);
        this.currentUser.set(guestUser);
        return guestUser;
      }
    } catch (e) {
      console.warn('Error fetching guest session', e);
    }

    // Create a new guest user with unique UUID
    const guestUser: AppUser = {
      uid: 'guest_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16),
      email: null,
      displayName: 'Invitado Local',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      isOfflineGuest: true,
      lastLogin: new Date().toISOString()
    };

    await Preferences.set({ key: this.GUEST_USER_KEY, value: JSON.stringify(guestUser) });
    this.currentUser.set(guestUser);
    return guestUser;
  }

  async loginWithGoogle(): Promise<AppUser | null> {
    if (!this.isOnline()) {
      throw new Error('No hay conexión a internet para iniciar sesión con Google.');
    }

    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await GoogleAuth.initialize({
            clientId: environment.googleWebClientId,
            scopes: ['profile', 'email'],
            grantOfflineAccess: true
          });
        } catch (initErr) {
          console.warn('GoogleAuth init warning:', initErr);
        }

        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        const fbUser = userCredential.user;

        const appUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || googleUser.name,
          photoURL: fbUser.photoURL || googleUser.imageUrl,
          isOfflineGuest: false,
          lastLogin: new Date().toISOString()
        };

        this.currentUser.set(appUser);
        await Preferences.set({ key: this.AUTH_USER_KEY, value: JSON.stringify(appUser) });
        return appUser;
      } else {
        // Web Platform OAuth2
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        const appUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Usuario Google',
          photoURL: fbUser.photoURL || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          isOfflineGuest: false,
          lastLogin: new Date().toISOString()
        };

        this.currentUser.set(appUser);
        await Preferences.set({ key: this.AUTH_USER_KEY, value: JSON.stringify(appUser) });
        return appUser;
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      throw err;
    }
  }

  async logout(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut().catch(() => {});
      }
      if (auth) {
        await fbSignOut(auth).catch(() => {});
      }
    } finally {
      await Preferences.remove({ key: this.AUTH_USER_KEY });
      await this.initGuestSession();
    }
  }
}
